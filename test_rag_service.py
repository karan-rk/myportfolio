import unittest
from pathlib import Path
from unittest.mock import patch

from rag_service import build_answer, contextualize_query, detect_intent, expand_query, extract_pdf_text, retrieve, run_evaluation


class RetrievalTests(unittest.TestCase):
    def test_retrieval_query_prioritizes_meta_experience(self):
        results = retrieve("What impact did Karan have at Meta?")
        self.assertEqual(results[0]["id"], "experience-meta")

    def test_nlp_query_prioritizes_relevant_work(self):
        results = retrieve("Which work demonstrates Karan's NLP experience?")
        self.assertIn(results[0]["id"], {"experience-research-methods", "projects-rolefit-rag"})

    def test_project_query_prioritizes_projects(self):
        results = retrieve("Which projects demonstrate NLP and applied machine learning?")
        self.assertTrue(results[0]["id"].startswith("projects-"))

    def test_role_profiles_change_candidate_fit_ranking(self):
        query = "Why is Karan a strong candidate?"
        self.assertEqual(retrieve(query, role="data-scientist")[0]["id"], "projects-sentinel")
        self.assertEqual(retrieve(query, role="software-engineer")[0]["id"], "experience-meta")

    def test_role_is_included_in_answer_trace(self):
        query = "Why is Karan a strong candidate?"
        answer = build_answer(query, retrieve(query, role="ml-engineer"), role="ml-engineer")
        self.assertEqual(answer["trace"]["role"], "ML Engineer")
        self.assertTrue(answer["answer"].startswith("For a ML Engineer role"))

    def test_answer_modes_control_response_shape(self):
        query = "What impact did Karan have at Meta?"
        passages = retrieve(query)
        short = build_answer(query, passages, answer_mode="short")
        detailed = build_answer(query, passages, answer_mode="detailed")
        bullets = build_answer(query, passages, answer_mode="bullets")
        self.assertLess(len(short["answer"]), len(detailed["answer"]))
        self.assertEqual(short["answer_points"], [])
        self.assertGreaterEqual(len(bullets["answer_points"]), 2)
        self.assertEqual(bullets["answer_mode"], "bullets")

    def test_natural_answer_does_not_repeat_summary(self):
        query = "Tell me about yourself"
        answer = build_answer(query, retrieve(query), answer_mode="short")
        self.assertNotIn("Based on Karan's portfolio evidence", answer["answer"])
        self.assertEqual(answer["answer"].count("production-scale"), 1)

    def test_follow_up_uses_previous_topic(self):
        resolved, used = contextualize_query(
            "Which skills did he use there?",
            [{"question": "What impact did Karan have at Meta?", "topic": "Meta and Instagram engineering impact"}],
        )
        self.assertTrue(used)
        self.assertIn("Meta", resolved)

    def test_standalone_question_does_not_use_context(self):
        query = "Which projects demonstrate NLP and applied machine learning?"
        resolved, used = contextualize_query(query, [{"question": "What impact did Karan have at Meta?"}])
        self.assertFalse(used)
        self.assertEqual(resolved, query)

    def test_evaluation_suite_reports_expected_metrics(self):
        evaluation = run_evaluation()
        self.assertEqual(evaluation["suite_cases"], 15)
        self.assertGreaterEqual(evaluation["top_evidence_accuracy"], 0.8)
        self.assertEqual(evaluation["citation_coverage"], 1.0)
        self.assertEqual(evaluation["abstention_accuracy"], 1.0)
        self.assertEqual(evaluation["role_ranking_accuracy"], 1.0)

    def test_answer_contains_citations(self):
        answer = build_answer("What impact did Karan have at Meta?", retrieve("What impact did Karan have at Meta?"))
        self.assertGreaterEqual(len(answer["citations"]), 1)
        self.assertIn(answer["confidence"], {"medium", "high"})
        self.assertIn("trace", answer)
        self.assertIn("excerpt", answer["citations"][0])
        self.assertIn("target", answer["citations"][0])

    def test_unknown_query_abstains(self):
        query = "What is the best recipe for chocolate cake?"
        with patch("rag_service.generate_profile_answer") as generator:
            answer = build_answer(query, retrieve(query), use_genai=True)
        self.assertTrue(answer["abstained"])
        self.assertEqual(answer["confidence"], "low")
        self.assertEqual(answer["citations"], [])
        generator.assert_not_called()

    def test_unrelated_request_without_profile_terms_abstains(self):
        query = "Give me a chocolate cake recipe"
        with patch("rag_service.generate_profile_answer") as generator:
            answer = build_answer(query, retrieve(query), use_genai=True)
        self.assertTrue(answer["abstained"])
        generator.assert_not_called()

    def test_supported_query_uses_genai_answer_when_available(self):
        query = "What impact did Karan have at Meta?"
        generated = "Karan built a billion-scale cohort-analysis pipeline at Meta."
        with patch("rag_service.generate_profile_answer", return_value=generated) as generator:
            answer = build_answer(query, retrieve(query), history=[], use_genai=True)
        self.assertEqual(answer["answer"], generated)
        self.assertTrue(answer["generated"])
        generator.assert_called_once()

    def test_supported_query_falls_back_when_genai_is_unavailable(self):
        query = "What machine learning research has Karan done?"
        with patch("rag_service.generate_profile_answer", return_value=None):
            answer = build_answer(query, retrieve(query), use_genai=True)
        self.assertFalse(answer["generated"])
        self.assertFalse(answer["abstained"])

    def test_detects_skills_intent(self):
        self.assertEqual(detect_intent("What skills make Karan a strong fit?"), "Skills")
        self.assertEqual(retrieve("What skills make Karan a strong fit?")[0]["id"], "skills-toolkit")

    def test_recruiter_phrasing_expands_to_evidence_topics(self):
        self.assertIn("professional summary", expand_query("Tell me about yourself"))
        self.assertEqual(retrieve("Tell me about yourself")[0]["id"], "resume-summary")
        self.assertEqual(retrieve("What is Karan's biggest professional achievement?")[0]["id"], "experience-meta")

    def test_leadership_and_platform_questions_retrieve_focused_evidence(self):
        self.assertEqual(retrieve("What leadership and communication experience does Karan have?")[0]["id"], "experience-teaching")
        self.assertEqual(retrieve("Does Karan have backend, cloud, and deployment experience?")[0]["id"], "skills-platform")

    def test_unknown_recruiter_fact_abstains(self):
        query = "What is Karan's current visa status?"
        answer = build_answer(query, retrieve(query))
        self.assertTrue(answer["abstained"])

    def test_unknown_skill_and_behavioral_question_abstain(self):
        query = "What are Karan's weaknesses?"
        answer = build_answer(query, retrieve(query))
        self.assertTrue(answer["abstained"])
        self.assertEqual(answer["citations"], [])

    def test_kubernetes_skill_is_answered_from_new_resume(self):
        query = "Does Karan have Kubernetes skills?"
        answer = build_answer(query, retrieve(query))
        self.assertFalse(answer["abstained"])
        self.assertTrue(any(citation["target"] in {"skills", "project-cloud-infrastructure"} for citation in answer["citations"]))

    def test_location_question_is_answered_from_availability_evidence(self):
        query = "Where is Karan located?"
        answer = build_answer(query, retrieve(query))
        self.assertFalse(answer["abstained"])
        self.assertIn("New York", answer["answer"])

    def test_citations_only_include_question_relevant_evidence(self):
        query = "What impact did Karan have at Meta?"
        answer = build_answer(query, retrieve(query), answer_mode="bullets")
        cited_ids = {citation["section"] for citation in answer["citations"]}
        self.assertIn("Meta and Instagram engineering impact", cited_ids)
        self.assertNotIn("Teaching, mentorship, and communication", cited_ids)
        self.assertNotIn("Machine learning research results", cited_ids)

    def test_general_hiring_question_leads_with_demonstrated_impact(self):
        self.assertEqual(retrieve("Why should we hire Karan?")[0]["id"], "experience-meta")

    def test_extract_resume_pdf(self):
        pdf_path = Path(__file__).parent / "assets" / "karan-rajendra-resume.pdf"
        result = extract_pdf_text(pdf_path.read_bytes())
        self.assertGreater(result["characters"], 1000)
        self.assertIn("KARAN RAJENDRA", result["text"])

    def test_rejects_invalid_pdf(self):
        with self.assertRaises(ValueError):
            extract_pdf_text(b"not a pdf")


if __name__ == "__main__":
    unittest.main()
