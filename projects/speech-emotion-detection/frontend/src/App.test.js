import { render, screen } from "@testing-library/react";

import App from "./App";


jest.mock("./components/Recorder", () => () => <div>Recorder controls</div>);
jest.mock("./components/JournalPane", () => () => <div>Journal panel</div>);

test("renders core workflow and privacy notice", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /speech emotion detection/i })).toBeInTheDocument();
  expect(screen.getByText(/not a medical or diagnostic tool/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /analyze recording/i })).toBeDisabled();
});
