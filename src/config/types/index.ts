export type Outcome = "win" | "loss";

export type Trade = {
  outcome: Outcome;
  balance: number;
  feesPaid: number;
};
