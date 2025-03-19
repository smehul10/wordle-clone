

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { signInWithGoogle } from "./services/authService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://127.0.0.1:5000";

const App: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill("")));
  const [feedbacks, setFeedbacks] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill("white")));
  const [attempt, setAttempt] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  // Start a new game when the component mounts
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    try {
      const response = await axios.get(`${API_URL}/start-game`);
      setGameId(response.data.game_id);
      setGuesses(Array(5).fill(null).map(() => Array(5).fill("")));
      setFeedbacks(Array(5).fill(null).map(() => Array(5).fill("white")));
      setAttempt(0);
      setGameOver(false);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const handleInputChange = (row: number, col: number, value: string) => {
    if (value.length > 1 || gameOver || row !== attempt) return;
    const newGuesses = [...guesses];
    newGuesses[row] = [...newGuesses[row]];
    newGuesses[row][col] = value.toLowerCase();
    setGuesses(newGuesses);
  };

  const submitGuess = async () => {
    if (guesses[attempt].join("").length < 5) {
      toast.warn("Enter a full 5-letter word!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/submit-guess`, {
        game_id: gameId,
        guess: guesses[attempt].join(""),
      });

      const { feedback, game_over, correct_word } = response.data;
      const newFeedback = [...feedbacks];
      newFeedback[attempt] = feedback;
      setFeedbacks(newFeedback);

      if (game_over) {
        toast.success(`Game Over! The word was: ${correct_word}`);
        setGameOver(true);
      } else {
        setAttempt(attempt + 1);
      }
    } catch (error) {
      console.error("Error submitting guess:", error);
    }
  };

  const handleSignIn = async () => {
    const user = await signInWithGoogle();
    if (user) {
      setUser(user);
      toast.success(`Welcome ${user.displayName}!`);
    }
  };

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
    toast.info("Logged out successfully.");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100vw",
      background: "black",
      color: "white"
    }}>
      {!user ? (
        <button onClick={handleSignIn} style={{ position: "absolute", top: 20, right: 20 }}>
          Sign In
        </button>
      ) : (
        <button onClick={handleSignOut} style={{ position: "absolute", top: 20, right: 20 }}>
          Sign Out
        </button>
      )}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "min(90%, 500px)",
      textAlign: "center"
      }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>Wordle Clone</h1>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
        {guesses.map((guess, row) => (
          <div key={row} style={{ display: "flex", gap: "5px" }}>
            {guess.map((letter, col) => (
              <input
                key={col}
                type="text"
                maxLength={1}
                value={letter}
                onChange={(e) => handleInputChange(row, col, e.target.value)}
                disabled={row !== attempt}
                style={{
                  width: "40px",
                  height: "40px",
                  fontSize: "20px",
                  textAlign: "center",
                  textTransform: "uppercase",
                  backgroundColor: feedbacks[row][col],
                  color: "black",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      </div>

      {!gameOver && <button onClick={submitGuess} style={{ marginTop: "20px", padding: "10px" }}>Submit</button>}

      {gameOver && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={startNewGame}>New Game</button>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default App;

