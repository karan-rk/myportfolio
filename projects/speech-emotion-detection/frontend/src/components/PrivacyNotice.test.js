import { render, screen } from "@testing-library/react";

import PrivacyNotice from "./PrivacyNotice";


test("explains storage and medical limitations", () => {
  render(<PrivacyNotice />);
  expect(screen.getByText(/is not saved by the public portfolio demo/i)).toBeInTheDocument();
  expect(screen.getByText(/not a medical or diagnostic tool/i)).toBeInTheDocument();
});
