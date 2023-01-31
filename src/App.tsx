import { useState, useCallback, useMemo } from "react";
import NumberInput from "./components/input/NumberInput";
import {
  defaultBalance,
  defaultLimitOrderFee,
  defaultMarketOrderFee,
  defaultNoTrades,
  defaultSL,
  defaultTP,
  defaultWinRate,
} from "./config/constants";
import { Outcome, Trade } from "./config/types";
import { normalizePercentageOnChange } from "./helpers/validation/input";

function App() {
  const [startBalance, setStartBalance] = useState(defaultBalance);
  const [winRate, setWinRate] = useState(defaultWinRate);
  const [takeProfit, setTakeProfit] = useState(defaultTP);
  const [stopLoss, setStopLoss] = useState(defaultSL);
  const [noTrades, setNoTrades] = useState(defaultNoTrades);
  const [limitOrderFee, setLimitOrderFee] = useState(defaultLimitOrderFee);
  const [marketOrderFee, setMarketOrderFee] = useState(defaultMarketOrderFee);
  const [trades, setTrades] = useState<Trade[]>([]);
  const maxNoWinsInTrades = useMemo(
    () => noTrades * (winRate / 100),
    [noTrades, winRate]
  );
  const maxNoLossesInTrades = useMemo(
    () => noTrades - maxNoWinsInTrades,
    [noTrades, maxNoWinsInTrades]
  );
  const isProfitable = useMemo(
    () => !!trades.length && trades[trades.length - 1].balance > startBalance,
    [trades, startBalance]
  );

  const getOutcome = useCallback(
    (noWins: number, noLosses: number) => {
      if (noWins < maxNoWinsInTrades) {
        if (noLosses < maxNoLossesInTrades)
          return Math.round(Math.random()) === 1 ? "win" : "loss";
        return "win";
      }
      return "loss";
    },
    [maxNoWinsInTrades, maxNoLossesInTrades]
  );
  const getNetProfit = useCallback(
    (outcome: Outcome, posStartBalance: number, posEndBalance: number) => {
      if (!!!marketOrderFee) {
        return { netProfit: posEndBalance, feesPaid: 0 };
      }
      let openPosFee = 0;
      let closePosFee = 0;

      if (!!marketOrderFee)
        openPosFee += (posStartBalance * marketOrderFee) / 100;
      else if (!!limitOrderFee)
        openPosFee += (posStartBalance * limitOrderFee) / 100;

      if (outcome === "win")
        closePosFee = (posEndBalance * limitOrderFee) / 100;
      else closePosFee = (posEndBalance * marketOrderFee) / 100;

      const feesPaid = openPosFee + closePosFee;
      const netProfit = posEndBalance - (feesPaid >= 1 ? feesPaid : 1);
      const result = {
        feesPaid: feesPaid >= 1 ? feesPaid : 1,
        netProfit: Number(netProfit),
      };
      return result;
    },
    [limitOrderFee, marketOrderFee]
  );
  const calculateProfit = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault();
      if (!!!noTrades) return;
      const newTrades: Trade[] = [];
      let balance = startBalance;
      let noWins = 0;
      let noLosses = 0;
      for (let i = 0; i < noTrades; i++) {
        const outcome =
          noWins === maxNoWinsInTrades ? "loss" : getOutcome(noWins, noLosses);
        let feesPaid = 0;
        if (outcome === "win") {
          const cleanProfit = balance + (balance * takeProfit) / 100;
          const netProfit = getNetProfit("win", Number(balance), cleanProfit);
          balance = Number(netProfit.netProfit);
          feesPaid += netProfit.feesPaid;
          noWins++;
        } else {
          const cleanProfit = balance - (balance * stopLoss) / 100;
          const netProfit = getNetProfit("loss", Number(balance), cleanProfit);
          balance = Number(netProfit.netProfit);
          feesPaid += netProfit.feesPaid;
          noLosses++;
        }
        newTrades.push({
          outcome,
          balance: Math.floor(Number(balance)),
          feesPaid: feesPaid.toFixed(2),
        });
      }
      setTrades(newTrades);
    },
    [
      noTrades,
      startBalance,
      maxNoWinsInTrades,
      takeProfit,
      stopLoss,
      getOutcome,
      getNetProfit,
    ]
  );

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div className="card">
        <form onSubmit={calculateProfit}>
          <div className="input-container">
            <NumberInput
              value={startBalance}
              label={{ value: "Starting Balance", postfix: "USD" }}
              onChange={(v) => setStartBalance(v)}
            />
            <NumberInput
              value={winRate}
              label={{ value: "Win Rate", postfix: "%" }}
              maxLength={3}
              onChange={(v) => setWinRate(v)}
              normalize={(v) => normalizePercentageOnChange(v)}
            />
            <NumberInput
              value={takeProfit}
              label={{ value: "Take Profit", postfix: "%" }}
              onChange={(v) => setTakeProfit(v)}
            />
            <NumberInput
              value={stopLoss}
              label={{ value: "Stop Loss", postfix: "%" }}
              onChange={(v) => setStopLoss(v)}
            />
            <NumberInput
              value={noTrades}
              label={{ value: "Number of Trades" }}
              onChange={(v) => setNoTrades(v)}
            />
            <NumberInput
              value={limitOrderFee}
              label={{ value: "Limit Order Fee", postfix: "%" }}
              onChange={(v) => setLimitOrderFee(v)}
            />
            <NumberInput
              value={marketOrderFee}
              label={{ value: "Market Order Fee", postfix: "%" }}
              onChange={(v) => setMarketOrderFee(v)}
            />
          </div>
          <div className="flex-row space-between button-outcome">
            <button id="submitButton" type="submit">
              Run Strategy
            </button>
            {!!trades.length && (
              <div
                style={{
                  color: isProfitable ? "green" : "red",
                }}
              >
                {`${isProfitable ? "+" : "-"}${
                  trades[trades.length - 1].balance
                }`}
                <span style={{ fontSize: "80%" }}>&nbsp;USD</span>
              </div>
            )}
          </div>
        </form>
        {!!trades.length && (
          <table style={{ width: "100%", marginTop: 20, textAlign: "center" }}>
            <thead>
              <tr>
                <th>Outcome</th>
                <th>Fee</th>
                <th>New Balance</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(({ outcome, balance, feesPaid }) => (
                <tr>
                  <td
                    style={{
                      textTransform: "capitalize",
                      color: outcome === "win" ? "green" : "red",
                    }}
                  >
                    {outcome}
                  </td>
                  <td>{feesPaid}</td>
                  <td>{balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
