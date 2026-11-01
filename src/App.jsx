import { useCallback, useEffect, useState } from "react";

const operationSymbols = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

const buttons = [
  { label: "AC", action: "clear", className: "key-muted", ariaLabel: "Clear" },
  { label: "+/−", action: "toggle-sign", className: "key-muted", ariaLabel: "Toggle sign" },
  { label: "%", action: "percent", className: "key-muted", ariaLabel: "Percent" },
  { label: "÷", operation: "divide", className: "key-operator", ariaLabel: "Divide" },
  { label: "7", number: "7" },
  { label: "8", number: "8" },
  { label: "9", number: "9" },
  { label: "×", operation: "multiply", className: "key-operator", ariaLabel: "Multiply" },
  { label: "4", number: "4" },
  { label: "5", number: "5" },
  { label: "6", number: "6" },
  { label: "−", operation: "subtract", className: "key-operator", ariaLabel: "Subtract" },
  { label: "1", number: "1" },
  { label: "2", number: "2" },
  { label: "3", number: "3" },
  { label: "+", operation: "add", className: "key-operator", ariaLabel: "Add" },
  { label: "0", number: "0", className: "key-zero" },
  { label: ".", action: "decimal", ariaLabel: "Decimal point" },
  { label: "=", action: "calculate", className: "key-equals", ariaLabel: "Calculate" },
];

function formatNumber(value) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 10,
    useGrouping: false,
  });
}

function App() {
  const [currentValue, setCurrentValue] = useState("0");
  const [storedValue, setStoredValue] = useState(null);
  const [pendingOperation, setPendingOperation] = useState(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clearCalculator = useCallback(() => {
    setCurrentValue("0");
    setStoredValue(null);
    setPendingOperation(null);
    setShouldResetDisplay(false);
    setErrorMessage("");
  }, []);

  const inputNumber = useCallback((number) => {
    setErrorMessage("");
    setCurrentValue((value) =>
      shouldResetDisplay || value === "Error" ? number : value === "0" ? number : value + number,
    );
    setShouldResetDisplay(false);
  }, [shouldResetDisplay]);

  const inputDecimal = useCallback(() => {
    setErrorMessage("");
    if (shouldResetDisplay || currentValue === "Error") {
      setCurrentValue("0.");
      setShouldResetDisplay(false);
    } else if (!currentValue.includes(".")) {
      setCurrentValue((value) => value + ".");
    }
  }, [currentValue, shouldResetDisplay]);

  const calculate = useCallback(() => {
    if (storedValue === null || !pendingOperation || currentValue === "Error") return;

    const secondValue = Number(currentValue);
    let answer;
    switch (pendingOperation) {
      case "add":
        answer = storedValue + secondValue;
        break;
      case "subtract":
        answer = storedValue - secondValue;
        break;
      case "multiply":
        answer = storedValue * secondValue;
        break;
      case "divide":
        if (secondValue === 0) {
          setCurrentValue("Error");
          setErrorMessage("Cannot divide by zero");
          setStoredValue(null);
          setPendingOperation(null);
          setShouldResetDisplay(true);
          return;
        }
        answer = storedValue / secondValue;
        break;
      default:
        return;
    }

    setCurrentValue(formatNumber(answer));
    setStoredValue(null);
    setPendingOperation(null);
    setShouldResetDisplay(true);
    setErrorMessage("");
  }, [currentValue, pendingOperation, storedValue]);

  const chooseOperation = useCallback((operation) => {
    if (currentValue === "Error") {
      clearCalculator();
      return;
    }
    if (storedValue !== null && pendingOperation && !shouldResetDisplay) {
      calculate();
    }
    setStoredValue(Number(currentValue));
    setPendingOperation(operation);
    setShouldResetDisplay(true);
  }, [calculate, clearCalculator, currentValue, pendingOperation, shouldResetDisplay, storedValue]);

  const handleAction = useCallback((action) => {
    switch (action) {
      case "clear":
        clearCalculator();
        break;
      case "decimal":
        inputDecimal();
        break;
      case "calculate":
        calculate();
        break;
      case "toggle-sign":
        if (currentValue !== "0" && currentValue !== "Error") {
          setCurrentValue((value) => (value.startsWith("-") ? value.slice(1) : `-${value}`));
        }
        break;
      case "percent":
        if (currentValue !== "Error") setCurrentValue(formatNumber(Number(currentValue) / 100));
        break;
      default:
        break;
    }
  }, [calculate, clearCalculator, currentValue, inputDecimal]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (/^\d$/.test(event.key)) inputNumber(event.key);
      else if (event.key === ".") inputDecimal();
      else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
      } else if (event.key === "Escape" || event.key.toLowerCase() === "c") clearCalculator();
      else if (event.key === "Backspace" && currentValue.length > 1 && currentValue !== "Error") {
        setCurrentValue((value) => value.slice(0, -1));
      } else if ({ "+": "add", "-": "subtract", "*": "multiply", "/": "divide" }[event.key]) {
        chooseOperation({ "+": "add", "-": "subtract", "*": "multiply", "/": "divide" }[event.key]);
      } else if (event.key === "%") handleAction("percent");
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [calculate, chooseOperation, clearCalculator, currentValue, handleAction, inputDecimal, inputNumber]);

  const expression =
    storedValue !== null && pendingOperation
      ? `${formatNumber(storedValue)} ${operationSymbols[pendingOperation]}`
      : errorMessage;

  return (
    <main className="calculator" aria-label="Calculator">
      <div className="display" aria-live="polite">
        <div className="expression">{expression}</div>
        <div className="result">{currentValue}</div>
      </div>
      <div className="keypad">
        {buttons.map((button) => (
          <button
            className={`key ${button.className ?? ""}`}
            key={button.label}
            aria-label={button.ariaLabel}
            onClick={() => {
              if (button.number !== undefined) inputNumber(button.number);
              else if (button.operation) chooseOperation(button.operation);
              else handleAction(button.action);
            }}
          >
            {button.label}
          </button>
        ))}
      </div>
    </main>
  );
}

export default App;
