import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  FaBolt,
  FaFire,
  FaWifi,
  FaTv,
  FaQuestionCircle,
  FaTimes,
} from "react-icons/fa";

const SERVICE_ICONS = [
  {
    key: "electricity",
    label: "Electricity",
    icon: <FaBolt />,
    color: "#FFD700",
  }, // Yellow
  { key: "gas", label: "Gas", icon: <FaFire />, color: "#FF4444" }, // Red
  { key: "wifi", label: "WiFi", icon: <FaWifi />, color: "#2196F3" }, // Strong Blue
  { key: "tv", label: "TV", icon: <FaTv />, color: "#43D15D" }, // Strong Green
];

function getSteps(selected) {
  const steps = [
    {
      key: "num_ppl",
      question:
        "How many people do you want to split the bills? (Must enter at least 2)",
      type: "number",
      min: 2,
      validate: (v) => v >= 2,
      icon: null,
      borderColor: null,
    },
  ];

  // Only ask days questions if electricity OR gas is selected
  if (selected.electricity || selected.gas) {
    steps.push({
      key: "tot_days",
      question: "How many days do your bills cover?",
      type: "number",
      min: 0.01,
      validate: (v) => v > 0,
      icon: null,
      borderColor: null,
    });
    steps.push({
      key: "pairs",
      question: "Enter the name and number of days for each person",
      type: "pairs",
      icon: null,
      borderColor: null,
    });
  } else {
    steps.push({
      key: "pairs",
      question: "Enter and add one name at the time",
      type: "pairs_names_only",
      icon: null,
      borderColor: null,
    });
  }

  // Tax rate if electricity or gas
  if (selected.electricity || selected.gas) {
    steps.push({
      key: "tax_rate",
      question: selected.electricity && selected.gas
        ? "Insert the VAT rate available on your energy bills receipt (usually around 5%)"
        : selected.electricity
        ? "Insert the VAT rate available on your electricity bills receipt (usually around 5%)"
        : "Insert the VAT rate available on your gas bills receipt (usually around 5%)",
      type: "number_percent",
      min: 0,
      validate: (v) => v >= 0,
      icon:
        selected.electricity && selected.gas
          ? "both"
          : selected.electricity
          ? "electricity"
          : "gas",
      borderColor:
        selected.electricity && selected.gas
          ? "gradient"
          : selected.electricity
          ? "#FFD700"
          : "#FF4444",
    });
  }

  // Electricity (combine both questions into one step)
  if (selected.electricity) {
    steps.push({
      key: "electricity_combined",
      question: "",
      type: "electricity_combined",
      icon: "electricity",
      borderColor: "#FFD700",
    });
  }

  // Gas (leave as is)
  if (selected.gas) {
    steps.push({
      key: "gas_combined",
      question: "",
      type: "gas_combined",
      icon: "gas",
      borderColor: "#FF4444",
    });
  }

  // WiFi
  if (selected.wifi) {
    steps.push({
      key: "wifi_tot_charge",
      question: "Insert the total cost from your WiFi bill (after VAT)",
      type: "number_pounds",
      min: 0,
      validate: (v) => v >= 0,
      icon: "wifi",
      borderColor: "#2196F3",
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
      icon: "tv",
      borderColor: "#43D15D",
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
    tot_days: selected.electricity || selected.gas ? "" : 30,
  };
}

// Loading spinner component
function LoadingSpinner({ progress }) {
  const radius = 45;
  const center = 50;
  const startAngle = 180; // leftmost
  const endAngle = 0; // rightmost
  const angle = startAngle - (progress / 100) * 180; // 0% = 180deg, 100% = 0deg
  const circumference = Math.PI * radius; // 180deg arc
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const dotX = center + radius * Math.cos((angle * Math.PI) / 180);
  const dotY = center + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="loading-spinner">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background arc */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          stroke="#61dafb"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
        {/* Moving dot */}
        <circle
          cx={dotX}
          cy={dotY}
          r="4"
          fill="#61dafb"
          style={{ transition: "cx 0.3s ease, cy 0.3s ease" }}
        />
      </svg>
      <div className="spinner-text">{Math.round(progress)}%</div>
    </div>
  );
}

// Help popup component
function HelpPopup({ isOpen, onClose }) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".help-popup-content")) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="help-popup-overlay">
      <div className="help-popup-content">
        <button className="help-popup-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h3>How does it work?</h3>
        <p>
          Bill Splitter is a free tool to split your bills fairly with your
          flatmates based on the number of days!
          <br />
          <br />
          We divide the fixed costs from the variable ones, and we treat them
          accordingly, giving you a fair split!
        </p>
      </div>
    </div>
  );
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
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef(null);
  const nameInputRef = useRef(null);
  const daysInputRef = useRef(null);
  const elecTotChargeRef = useRef(null);
  const gasTotChargeRef = useRef(null);

  const handleRestart = () => {
    setServiceStep(true);
    setStep(0);
    setAnswers({});
    setPairs([]);
    setPairInput({ name: "", num_days: "" });
    setSelected({
      electricity: false,
      gas: false,
      wifi: false,
      tv: false,
    });
    setResult(null);
    setError("");
    setLoading(false);
    setLoadingProgress(0);
  };

  const steps = getSteps(selected);
  const current = steps[step];

  // Number input validation
  const handleNumberInput = (e, allowDecimals = true) => {
    let value = e.target.value;
    // Replace comma with dot for decimal
    value = value.replace(",", ".");
    // Remove non-numeric characters except dot if decimals allowed
    if (allowDecimals) {
      value = value.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }
    } else {
      value = value.replace(/[^0-9]/g, "");
    }
    e.target.value = value;
  };

  // Check if current step is valid
  const isStepValid = () => {
    if (current.type === "pairs" || current.type === "pairs_names_only") {
      return pairs.length === parseInt(answers.num_ppl || 0, 10);
    }
    if (current.type === "electricity_combined") {
      const std = parseFloat(answers.elec_std_rate_pence);
      const tot = parseFloat(answers.elec_tot_charge);
      return !isNaN(std) && std >= 0 && !isNaN(tot) && tot >= 0;
    }
    if (current.type === "gas_combined") {
      const std = parseFloat(answers.gas_std_rate_pence);
      const tot = parseFloat(answers.gas_tot_charge);
      return !isNaN(std) && std >= 0 && !isNaN(tot) && tot >= 0;
    }
    if (current.type.startsWith("number")) {
      const val = parseFloat(answers[current.key]);
      return !isNaN(val) && (!current.validate || current.validate(val));
    }
    return true;
  };

  // Check if service selection is valid
  const isServiceSelectionValid = () => {
    return Object.values(selected).some(Boolean);
  };

  // Handle Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        if (serviceStep && isServiceSelectionValid()) {
          handleServiceProceed();
        } else if (!serviceStep && !result && isStepValid()) {
          if (step < steps.length - 1) {
            handleNext();
          } else {
            handleSubmit();
          }
        }
      }
    };
    document.addEventListener("keypress", handleKeyPress);
    return () => document.removeEventListener("keypress", handleKeyPress);
  }, [serviceStep, step, isStepValid, isServiceSelectionValid]);

  const handleServiceToggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleServiceProceed = () => {
    if (!isServiceSelectionValid()) {
      setError("Please select at least one service.");
      return;
    }
    setAnswers(getDefaultAnswers(selected));
    setServiceStep(false);
    setError("");
  };

  const handleNext = () => {
    if (!isStepValid()) {
      if (current.type === "pairs" || current.type === "pairs_names_only") {
        setError(`Please enter info for all ${answers.num_ppl} people.`);
      } else {
        setError("Please enter a valid value.");
      }
      return;
    }
    setError("");
    if (current.type === "pairs" || current.type === "pairs_names_only") {
      setAnswers((a) => ({ ...a, pairs }));
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleChange = (e) => {
    if (current.type === "electricity_combined") {
      setAnswers((a) => ({ ...a, [e.target.name]: e.target.value }));
    } else if (current.type === "gas_combined") {
      setAnswers((a) => ({ ...a, [e.target.name]: e.target.value }));
    } else {
      setAnswers((a) => ({ ...a, [current.key]: e.target.value }));
    }
  };

  const handlePairChange = (e) => {
    setPairInput({ ...pairInput, [e.target.name]: e.target.value });
  };

  const handleAddPair = () => {
    if (!pairInput.name) {
      setError("Please enter a name.");
      return;
    }
    if (
      current.type === "pairs" &&
      (isNaN(parseFloat(pairInput.num_days)) ||
        parseFloat(pairInput.num_days) > answers.tot_days)
    ) {
      setError("Please enter a valid number of days.");
      return;
    }
    if (pairs.length >= parseInt(answers.num_ppl || 0, 10)) {
      setError("You have already entered all people.");
      return;
    }

    const newPair =
      current.type === "pairs_names_only"
        ? { name: pairInput.name, num_days: 30 }
        : { ...pairInput, num_days: parseFloat(pairInput.num_days) };

    setPairs([...pairs, newPair]);
    setPairInput({ name: "", num_days: "" });
    setError("");
  };

  const handleRemovePair = (idx) => {
    setPairs(pairs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setError("");
    setResult(null);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 100);

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
      if (!res.ok) throw new Error(data.error || "Unknown error");

      setLoadingProgress(100);
      setTimeout(() => {
        setResult(data);
        setLoading(false);
        clearInterval(progressInterval);
      }, 500);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Bill Splitter",
      text: "Check out this awesome Bill Splitter app that helps you split bills fairly with your flatmates!",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // Use Web Share API on mobile devices
        await navigator.share(shareData);
      } else {
        // Fallback for desktop: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setError("Link copied to clipboard!");
        setTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Failed to share. Please try copying the link manually.");
      }
    }
  };

  const renderIcon = (iconKey) => {
    const iconData = SERVICE_ICONS.find((s) => s.key === iconKey);
    if (!iconData) return null;
    return (
      <div className="question-icon" style={{ color: iconData.color }}>
        {iconData.icon}
      </div>
    );
  };

  const renderQuestionIcons = () => {
    if (!current.icon) return null;
    if (current.icon === "both") {
      return (
        <div className="question-icons">
          {renderIcon("electricity")}
          {renderIcon("gas")}
        </div>
      );
    }
    return renderIcon(current.icon);
  };

  // Autofocus logic
  useEffect(() => {
    if (serviceStep) return;
    if (result) return;
    if (current.type === "pairs" || current.type === "pairs_names_only") {
      if (nameInputRef.current) nameInputRef.current.focus();
    } else {
      if (inputRef.current) inputRef.current.focus();
    }
  }, [step, serviceStep, result, current.type]);

  // Update handlePairKeyDown to handle Enter navigation between name and days, and to next step after last entry
  const handlePairKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.name === "name") {
        // Move focus to days field if available
        if (daysInputRef.current) {
          daysInputRef.current.focus();
          e.preventDefault();
        }
      } else if (e.target.name === "num_days") {
        // If name is empty, focus back on name field
        if (!pairInput.name) {
          if (nameInputRef.current) {
            nameInputRef.current.focus();
            e.preventDefault();
            return;
          }
        }
        // If both fields are filled, add pair and move focus
        if (pairInput.name && !isNaN(parseFloat(pairInput.num_days)) && parseFloat(pairInput.num_days) <= answers.tot_days) {
          handleAddPair();
          setTimeout(() => {
            if (pairs.length + 1 < parseInt(answers.num_ppl || 0, 10)) {
              if (nameInputRef.current) nameInputRef.current.focus();
            } else {
              // If last pair, go to next step
              if (isStepValid()) handleNext();
            }
          }, 0);
          e.preventDefault();
        }
      }
    }
  };

  // Update handleCombinedKeyDown to move focus from first to second input, or go to next step from second input
  const handleCombinedKeyDown = (e) => {
    if (e.key === "Enter") {
      if (current.type === "electricity_combined") {
        if (e.target.name === "elec_std_rate_pence") {
          if (elecTotChargeRef.current) {
            elecTotChargeRef.current.focus();
            e.preventDefault();
            return;
          }
        } else if (e.target.name === "elec_tot_charge") {
          // If first input is empty, focus back on it
          if (!answers.elec_std_rate_pence) {
            if (inputRef.current) {
              inputRef.current.focus();
              e.preventDefault();
              return;
            }
          }
          // If both inputs are filled, proceed to next step
          if (isStepValid()) {
            if (step < steps.length - 1) {
              handleNext();
            } else {
              handleSubmit();
            }
            e.preventDefault();
            return;
          }
        }
      } else if (current.type === "gas_combined") {
        if (e.target.name === "gas_std_rate_pence") {
          if (gasTotChargeRef.current) {
            gasTotChargeRef.current.focus();
            e.preventDefault();
            return;
          }
        } else if (e.target.name === "gas_tot_charge") {
          // If first input is empty, focus back on it
          if (!answers.gas_std_rate_pence) {
            if (inputRef.current) {
              inputRef.current.focus();
              e.preventDefault();
              return;
            }
          }
          // If both inputs are filled, proceed to next step
          if (isStepValid()) {
            if (step < steps.length - 1) {
              handleNext();
            } else {
              handleSubmit();
            }
            e.preventDefault();
            return;
          }
        }
      }
      // fallback: original behavior
      if (isStepValid()) {
        if (step < steps.length - 1) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    }
  };

  return (
    <div className="App">
      <h1>Bill Splitter</h1>

      {/* Restart button */}
      <button className="restart-btn" onClick={handleRestart}>
        Start Over
      </button>

      {/* Help button */}
      <div className="help-button" onClick={() => setShowHelp(true)}>
        <FaQuestionCircle />
        <span>How does it work?</span>
      </div>

      <HelpPopup isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {serviceStep ? (
        <div className="service-select-modal">
          <h2>Select all the services you want to include in your bills</h2>
          <div className="service-icons">
            {SERVICE_ICONS.map((s) => (
              <div
                key={s.key}
                className={`service-icon${selected[s.key] ? " selected" : ""}`}
                data-service={s.key}
                onClick={() => handleServiceToggle(s.key)}
                style={{
                  "--icon-color": s.color,
                }}
              >
                <div className="service-icon-inner">{s.icon}</div>
                <div className="service-label">{s.label}</div>
                {selected[s.key] && <div className="tick">✓</div>}
              </div>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
          <button
            className={`proceed-btn ${
              !isServiceSelectionValid() ? "disabled" : ""
            }`}
            onClick={handleServiceProceed}
            disabled={!isServiceSelectionValid()}
          >
            Proceed
          </button>
        </div>
      ) : result ? (
        <div className="modal">
          <h2>Results</h2>
          <ul>
            {result.results.map((r) => (
              <li key={r.name}>
                <b>{r.name}</b>
                {(selected.electricity || selected.gas) && ` stayed ${r.days} days`}
                {` owes `}
                <b>£{Number(r.share).toFixed(2)}</b>
              </li>
            ))}
          </ul>
          <div
            className={`result-status ${result.all_good ? "success" : "error"}`}
          >
            {result.all_good
              ? "All good!"
              : `Calculation error: £${Number(result.error).toFixed(2)}`}
          </div>
          <div className="share-message">
            If you like our tool and find it useful, please share it with your
            friends! We appreciate your support.
            <button className="share-btn" onClick={handleShare}>
              Share
            </button>
          </div>
        </div>
      ) : (
        <div
          className="modal"
          style={{
            borderColor:
              current.borderColor === "gradient"
                ? "transparent"
                : current.borderColor,
            borderImage:
              current.borderColor === "gradient"
                ? "linear-gradient(90deg, #FFD700 50%, #FF4444 50%) 1"
                : "none",
          }}
        >
          {renderQuestionIcons()}
          <h2>
            Step {step + 1} of {steps.length}
          </h2>
          <div className="question">{current.question}</div>

          {current.type === "number" && (
            <input
              ref={inputRef}
              type="text"
              min={current.min}
              value={answers[current.key] || ""}
              onChange={handleChange}
              onInput={(e) => handleNumberInput(e, true)}
              className="input"
            />
          )}

          {current.type === "number_percent" && (
            <div className="input-with-symbol">
              <input
                ref={inputRef}
                type="text"
                min={0}
                value={answers[current.key] || ""}
                onChange={handleChange}
                onInput={(e) => handleNumberInput(e, true)}
                className="input"
                style={{ textAlign: "right" }}
              />
              <span className="input-symbol">%</span>
            </div>
          )}

          {current.type === "number_pence_per_day" && (
            <div className="input-with-symbol">
              <input
                ref={inputRef}
                type="text"
                min={0}
                value={answers[current.key] || ""}
                onChange={handleChange}
                onInput={(e) => handleNumberInput(e, true)}
                className="input"
                style={{ textAlign: "right" }}
              />
              <span className="input-symbol">pence/day</span>
            </div>
          )}

          {current.type === "number_pounds" && (
            <div className="input-with-symbol">
              <input
                ref={inputRef}
                type="text"
                min={0}
                value={answers[current.key] || ""}
                onChange={handleChange}
                onInput={(e) => handleNumberInput(e, true)}
                className="input"
                style={{ textAlign: "right" }}
              />
              <span className="input-symbol">£</span>
            </div>
          )}

          {(current.type === "pairs" ||
            current.type === "pairs_names_only") && (
            <div>
              <div className="pair-input-container">
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={pairInput.name}
                  onChange={handlePairChange}
                  onKeyDown={handlePairKeyDown}
                  className="input"
                  style={{ textAlign: "left" }}
                  disabled={pairs.length >= parseInt(answers.num_ppl || 0, 10)}
                />
                {current.type === "pairs" && (
                  <input
                    ref={daysInputRef}
                    type="text"
                    name="num_days"
                    placeholder="Days at property"
                    min={0}
                    max={answers.tot_days || ""}
                    value={pairInput.num_days}
                    onChange={handlePairChange}
                    onInput={(e) => handleNumberInput(e, true)}
                    onKeyDown={handlePairKeyDown}
                    className="input"
                    disabled={pairs.length >= parseInt(answers.num_ppl || 0, 10)}
                  />
                )}
                <button
                  onClick={handleAddPair}
                  className={`add-btn ${
                    pairs.length >= parseInt(answers.num_ppl || 0, 10)
                      ? "disabled"
                      : ""
                  }`}
                  disabled={pairs.length >= parseInt(answers.num_ppl || 0, 10)}
                >
                  Add
                </button>
              </div>
              <div style={{ margin: '8px 0', fontWeight: 500, textAlign: 'center' }}>
                {(() => {
                  const numPeople = parseInt(answers.num_ppl || 0, 10);
                  const left = numPeople - pairs.length;
                  if (numPeople > 0 && left > 0) {
                    return `You still have to add ${left} people`;
                  } else if (numPeople > 0 && left === 0) {
                    return 'All people have been added. Please click next!';
                  } else {
                    return null;
                  }
                })()}
              </div>
              <ul className="pair-list">
                {pairs.map((p, i) => (
                  <li key={i}>
                    {p.name} {current.type === "pairs" && `- ${p.num_days} days`}
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

          {current.type === "electricity_combined" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 4 }}>
                  Insert the electricity-related standing rate (before VAT, e.g. 27.89 p/day)
                </h3>
                <div className="input-with-symbol">
                  <input
                    ref={inputRef}
                    type="text"
                    name="elec_std_rate_pence"
                    placeholder="Standing rate (pence/day)"
                    min={0}
                    value={answers.elec_std_rate_pence || ""}
                    onChange={handleChange}
                    onInput={(e) => handleNumberInput(e, true)}
                    className="input"
                    style={{ textAlign: "right", width: "100%", maxWidth: 300 }}
                    onKeyDown={handleCombinedKeyDown}
                  />
                  <span className="input-symbol">pence/day</span>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: 4 }}>
                  Insert the electricity-related total charge (after VAT)
                </h3>
                <div className="input-with-symbol">
                  <input
                    ref={elecTotChargeRef}
                    type="text"
                    name="elec_tot_charge"
                    placeholder="Total charge (after VAT)"
                    min={0}
                    value={answers.elec_tot_charge || ""}
                    onChange={handleChange}
                    onInput={(e) => handleNumberInput(e, true)}
                    className="input"
                    style={{ textAlign: "right", width: "100%", maxWidth: 300 }}
                    onKeyDown={handleCombinedKeyDown}
                  />
                  <span className="input-symbol">£</span>
                </div>
              </div>
            </div>
          )}

          {current.type === "gas_combined" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 4 }}>
                  Insert the gas-related standing rate (before VAT, e.g. 27.89 p/day)
                </h3>
                <div className="input-with-symbol">
                  <input
                    ref={inputRef}
                    type="text"
                    name="gas_std_rate_pence"
                    placeholder="Standing rate (pence/day)"
                    min={0}
                    value={answers.gas_std_rate_pence || ""}
                    onChange={handleChange}
                    onInput={(e) => handleNumberInput(e, true)}
                    className="input"
                    style={{ textAlign: "right", width: "100%", maxWidth: 300 }}
                    onKeyDown={handleCombinedKeyDown}
                  />
                  <span className="input-symbol">pence/day</span>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: 4 }}>
                  Insert the gas-related total charge (after VAT)
                </h3>
                <div className="input-with-symbol">
                  <input
                    ref={gasTotChargeRef}
                    type="text"
                    name="gas_tot_charge"
                    placeholder="Total charge (after VAT)"
                    min={0}
                    value={answers.gas_tot_charge || ""}
                    onChange={handleChange}
                    onInput={(e) => handleNumberInput(e, true)}
                    className="input"
                    style={{ textAlign: "right", width: "100%", maxWidth: 300 }}
                    onKeyDown={handleCombinedKeyDown}
                  />
                  <span className="input-symbol">£</span>
                </div>
              </div>
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
              <button
                onClick={handleNext}
                className={`nav-btn ${!isStepValid() ? "disabled" : ""}`}
                disabled={!isStepValid()}
              >
                Next
              </button>
            )}
            {step === steps.length - 1 && (
              <button
                onClick={handleSubmit}
                className={`submit-btn ${
                  !isStepValid() || loading ? "disabled" : ""
                }`}
                disabled={!isStepValid() || loading}
              >
                {loading ? (
                  <div className="submit-loading">
                    <span>Calculating...</span>
                    <LoadingSpinner progress={loadingProgress} />
                  </div>
                ) : (
                  "Submit"
                )}
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
