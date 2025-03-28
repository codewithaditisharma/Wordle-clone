import { Keyboard } from "lucide-react";
import { useState, useEffect } from "react";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const WORD_API_URL = "https://random-word-api.herokuapp.com/word?length=5";
const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const App = () => {
  const [targetWord, setTargetWord] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNewWord = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(WORD_API_URL);
      const [word] = await response.json();

      // Validate word exists in dictionary
      const dictResponse = await fetch(`${DICTIONARY_API_URL}${word}`);
      if (!dictResponse.ok) {
        // If word not found in dictionary, try again
        return fetchNewWord();
      }

      setTargetWord(word.toUpperCase());
      setLoading(false);
    } catch (err) {
      setError("Failed to load word. Please refresh.");
      console.log("Failed to load word: ", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewWord();
  }, []);

  const validateWord = async (word: string) => {
    try {
      const response = await fetch(
        `${DICTIONARY_API_URL}${word.toLowerCase()}`
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (gameOver || loading) return;

    if (e.key === "Enter" && currentGuess.length === WORD_LENGTH) {
      submitGuess();
    } else if (e.key === "Backspace") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH && /^[A-Za-z]$/.test(e.key)) {
      setCurrentGuess((prev) => (prev + e.key).toUpperCase());
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentGuess, gameOver, loading]);

  const submitGuess = async () => {
    if (!(await validateWord(currentGuess))) {
      setMessage("Not a valid word!");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");
    setMessage("");

    if (currentGuess === targetWord) {
      setGameOver(true);
      setMessage("Congratulations! You won! 🎉");
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
      setMessage(`Game Over! The word was ${targetWord}`);
    }
  };

  const getLetterColor = (letter: string, index: number, guess: string) => {
    if (guess[index] === targetWord[index]) {
      return "bg-green-500";
    }
    if (targetWord.includes(letter)) {
      return "bg-yellow-500";
    }
    return "bg-gray-500";
  };

  const resetGame = () => {
    setCurrentGuess("");
    setGuesses([]);
    setGameOver(false);
    setMessage("");
    fetchNewWord();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchNewWord}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-8">
      <div className="mb-8 flex items-center gap-2">
        <Keyboard className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Wordle Clone</h1>
      </div>

      {loading ? (
        <div className="text-xl">Loading word...</div>
      ) : (
        <>
          <div className="mb-8">
            {[...Array(MAX_ATTEMPTS)].map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 mb-2">
                {[...Array(WORD_LENGTH)].map((_, colIndex) => {
                  const letter =
                    rowIndex === guesses.length
                      ? currentGuess[colIndex]
                      : guesses[rowIndex]?.[colIndex];

                  const letterColor = guesses[rowIndex]
                    ? getLetterColor(letter, colIndex, guesses[rowIndex])
                    : "bg-gray-700";

                  return (
                    <div
                      key={colIndex}
                      className={`w-14 h-14 ${letterColor} flex items-center justify-center text-2xl font-bold rounded`}
                    >
                      {letter || ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {message && <div className="mb-4 text-xl font-bold">{message}</div>}

          {gameOver && (
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded font-bold"
            >
              Play Again
            </button>
          )}

          <div className="mt-8 text-gray-400 text-center">
            <p>Type letters to make your guess</p>
            <p>Press Enter to submit</p>
            <p>Green = Correct letter and position</p>
            <p>Yellow = Correct letter, wrong position</p>
            <p>Gray = Letter not in word</p>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
