import React, { useState } from "react";
import "./App.css";
import { FaBolt, FaFire, FaWifi, FaTv } from "react-icons/fa";

const SERVICE_ICONS = [
  { key: "electricity", label: "Electricity", icon: <FaBolt /> },
  { key: "gas", label: "Gas", icon: <FaFire /> },
  { key: "wifi", label: "WiFi", icon: <FaWifi /> },
  { key: "tv", label: "TV", icon: <FaTv /> },
];

function getSteps(selected) {
  // Always ask num_ppl and tot_days
  const steps = [
    {
      key: "num_ppl",
      question:
        "How many people do you want to split the bills? (Must enter at least 2)",
      type: "number",
      min: 2,
      validate: (v) => v >= 2,
    },
    {
      key: "tot_days",
      question: "How many days do your bills cover?",
      type: "number",
      min: 1,
      validate: (v) => v > 0,
    },
    {
      key: "pairs",
      question: "Enter the name and number of days for each person",
      type: "pairs",
    },
  ];
  // Tax rate if electricity or gas
  if (selected.electricity || selected.gas) {
    steps.push({
      key: "tax_rate",
      question:
        "Insert the VAT available on your bills receipt (usually around 5%)",
      type: "number_percent",
      min: 0,
      validate: (v) => v >= 0,
    });
  }
  // Electricity
  if (selected.electricity) {
    steps.push({
      key: "elec_std_rate_pence",
      question:
        "Insert the electricity-related standing rate (before VAT, e.g. 27.89 p/day)",
      type: "number_pence_per_day",
      min: 0,
      validate: (v) => v >= 0,
    });
    steps.push({
      key: "elec_tot_charge",
      question: "Insert the electricity-related total charge (after VAT)",
      type: "number_pounds",
      min: 0,
      validate: (v) => v >= 0,
    });
  }
  // Gas
  if (selected.gas) {
    steps.push({
      key: "gas_std_rate_pence",
      question:
        "Insert the gas-related standing rate (before VAT, e.g. 27.89 p/day)",
      type: "number_pence_per_day",
      min: 0,
      validate: (v) => v >= 0,
    });
    steps.push({
      key: "gas_tot_charge",
      question: "Insert the gas-related total charge (after VAT)",
      type: "number_pounds",
      min: 0,
      validate: (v) => v >= 0,
    });
  }
  // WiFi
  if (selected.wifi) {
    steps.push({
      key: "wifi_tot_charge",
      question: "Insert the total cost from your Wifi bill (after VAT)",
      type: "number_pounds",
      min: 0,
      validate: (v) => v >= 0,
    });
  }
  // TV
  if (selected.tv) {
    steps.push({
      key: "tv_tot_charge",
      question:
        "Insert the total cost from your TV license or pay-TV bill (after VAT)",
      type: "number_pounds",
      min: 0,
      validate: (v) => v >= 0,
    });
  }
  return steps;
}

function getDefaultAnswers(selected) {
  return {
    elec_std_rate_pence: selected.electricity ? "" : 0,
    elec_tot_charge: selected.electricity ? "" : 0,
    gas_std_rate_pence: selected.gas ? "" : 0,
    gas_tot_charge: selected.gas ? "" : 0,
    wifi_tot_charge: selected.wifi ? "" : 0,
    tv_tot_charge: selected.tv ? "" : 0,
    tax_rate: selected.electricity || selected.gas ? "" : 0,
  };
}

function App() {
  const [serviceStep, setServiceStep] = useState(true);
  const [selected, setSelected] = useState({
    electricity: false,
    gas: false,
    wifi: false,
    tv: false,
  });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [pairs, setPairs] = useState([]);
  const [pairInput, setPairInput] = useState({ name: "", num_days: "" });
  const [pairCount, setPairCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const steps = getSteps(selected);

  const handleServiceToggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleServiceProceed = () => {
    // At least one service must be selected
    if (!Object.values(selected).some(Boolean)) {
      setError("Please select at least one service.");
      return;
    }
    setAnswers(getDefaultAnswers(selected));
    setServiceStep(false);
    setError("");
  };

  const handleNext = () => {
    setError("");
    const current = steps[step];
    if (current.type === "pairs") {
      if (pairs.length !== parseInt(answers.num_ppl || 0, 10)) {
        setError(`Please enter info for all ${answers.num_ppl} people.`);
        return;
      }
      setAnswers((a) => ({ ...a, pairs }));
      setStep((s) => s + 1);
      return;
    }
    if (current.type === "number") {
      const val = parseFloat(answers[current.key]);
      if (isNaN(val) || (current.validate && !current.validate(val))) {
        setError("Please enter a valid value.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleChange = (e) => {
    setAnswers((a) => ({ ...a, [steps[step].key]: e.target.value }));
  };

  const handlePairChange = (e) => {
    setPairInput({ ...pairInput, [e.target.name]: e.target.value });
  };

  const handleAddPair = () => {
    if (!pairInput.name || isNaN(parseFloat(pairInput.num_days))) {
      setError("Please enter a name and valid number of days.");
      return;
    }
    if (parseFloat(pairInput.num_days) > answers.tot_days) {
      setError(
        "Please enter a number of days less than or equal to the total number of days."
      );
      return;
    }
    if (pairs.length >= parseInt(answers.num_ppl || 0, 10)) {
      setError("You have already entered all people.");
      return;
    }
    setPairs([
      ...pairs,
      { ...pairInput, num_days: parseFloat(pairInput.num_days) },
    ]);
    setPairInput({ name: "", num_days: "" });
    setPairCount(pairCount + 1);
    setError("");
  };

  const handleRemovePair = (idx) => {
    setPairs(pairs.filter((_, i) => i !== idx));
    setPairCount(pairCount - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const apiUrl =
        (process.env.REACT_APP_API_URL || "http://localhost:5000") +
        "/api/split";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, pairs }),
      });
      const data = await res.json();
      console.log("Response status:", res.status, "Body:", data);
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step content
  const current = steps[step];
  return (
    <div className="App">
      <h1>Bill Splitter</h1>
      {serviceStep ? (
        <div className="service-select-modal">
          <div className="service-icons">
            {SERVICE_ICONS.map((s) => (
              <div
                key={s.key}
                className={`service-icon${selected[s.key] ? " selected" : ""}`}
                onClick={() => handleServiceToggle(s.key)}
              >
                {s.icon}
                <div className="service-label">{s.label}</div>
                {selected[s.key] && <div className="tick">✓</div>}
              </div>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
          <button className="proceed-btn" onClick={handleServiceProceed}>
            Proceed
          </button>
        </div>
      ) : result ? (
        <div className="modal">
          <h2>Results</h2>
          <ul>
            {result.results.map((r) => (
              <li key={r.name}>
                <b>{r.name}</b> stayed {r.days} days, owes{" "}
                <b>£{r.share.toFixed(2)}</b>
              </li>
            ))}
          </ul>
          <div style={{ color: result.all_good ? "green" : "red" }}>
            {result.all_good
              ? "All good!"
              : `Calculation error: £${result.error.toFixed(2)}`}
          </div>
          <button
            onClick={() => {
              setResult(null);
              setServiceStep(true);
              setStep(0);
              setAnswers({});
              setPairs([]);
              setPairInput({ name: "", num_days: "" });
              setPairCount(0);
              setSelected({
                electricity: false,
                gas: false,
                wifi: false,
                tv: false,
              });
            }}
          >
            Start Over
          </button>
        </div>
      ) : (
        <div className="modal">
          <h2>
            Step {step + 1} of {steps.length}
          </h2>
          <div className="question">{current.question}</div>
          {current.type === "number" && (
            <input
              type="number"
              min={current.min}
              value={answers[current.key] || ""}
              onChange={handleChange}
              className="input"
            />
          )}
          {current.type === "number_percent" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                type="number"
                min={0}
                value={answers[current.key] || ""}
                onChange={handleChange}
                className="input"
                style={{ marginRight: 6 }}
              />
              <span className="input-symbol">%</span>
            </div>
          )}
          {current.type === "number_pence_per_day" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                type="number"
                min={0}
                value={answers[current.key] || ""}
                onChange={handleChange}
                className="input"
                style={{ marginRight: 6 }}
              />
              <span className="input-symbol">pence/day</span>
            </div>
          )}
          {current.type === "number_pounds" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="input-symbol" style={{ marginRight: 6 }}>
                £
              </span>
              <input
                type="number"
                min={0}
                value={answers[current.key] || ""}
                onChange={handleChange}
                className="input"
              />
            </div>
          )}
          {current.type === "pairs" && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={pairInput.name}
                  onChange={handlePairChange}
                  className="input"
                />
                <input
                  type="number"
                  name="num_days"
                  placeholder="Days at property"
                  min={0}
                  max={answers.tot_days || ""}
                  value={pairInput.num_days}
                  onChange={handlePairChange}
                  className="input"
                />
                <button onClick={handleAddPair} className="add-btn">
                  Add
                </button>
              </div>
              <ul className="pair-list">
                {pairs.map((p, i) => (
                  <li key={i}>
                    {p.name} - {p.num_days} days
                    <button
                      onClick={() => handleRemovePair(i)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <div className="error">{error}</div>}
          <div className="actions">
            {step === 0 && (
              <button
                onClick={() => {
                  setServiceStep(true);
                  setStep(0);
                  setAnswers({});
                  setPairs([]);
                  setPairInput({ name: "", num_days: "" });
                  setPairCount(0);
                }}
                className="nav-btn"
              >
                Back to Services
              </button>
            )}
            {step > 0 && (
              <button onClick={handlePrev} className="nav-btn">
                Back
              </button>
            )}
            {step < steps.length - 1 && (
              <button onClick={handleNext} className="nav-btn">
                Next
              </button>
            )}
            {step === steps.length - 1 && (
              <button
                onClick={handleSubmit}
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Calculating..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="footer-smallprint">
        Made by
        <a
          href="https://www.linkedin.com/in/pietro-rossi-2b1192237/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Pietro Rossi
        </a>
        and
        <a
          href="https://www.linkedin.com/in/oscar-alberigo-593744258/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Oscar Alberigo
        </a>
      </div>
    </div>
  );
}

export default App;
