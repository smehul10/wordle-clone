import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { signInWithGoogle } from "./services/authService";
import { updateUserStats } from "./services/firestoreService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://127.0.0.1:5000";

const App: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill("")));
  const [feedbacks, setFeedbacks] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill("white")));
  const [attempt, setAttempt] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [joinCode, setJoinCode] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const startNewGame = async () => {
    try {
      const response = await axios.get(`${API_URL}/start-game`);
      setGameId(response.data.game_id);
      setPlayerId(response.data.player_id);
      setGuesses(Array(5).fill(null).map(() => Array(5).fill("")));
      setFeedbacks(Array(5).fill(null).map(() => Array(5).fill("white")));
      setAttempt(0);
      setGameOver(false);
      toast.info(`You are Player 1. Share this Game ID with your opponent: ${response.data.game_id}`);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const joinExistingGame = async () => {
    if (playerId) {
      toast.info("You're already in a game.");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/join-game`, { game_id: joinCode.trim() });
      setGameId(joinCode.trim());
      setPlayerId(response.data.player_id);
      setGuesses(Array(5).fill(null).map(() => Array(5).fill("")));
      setFeedbacks(Array(5).fill(null).map(() => Array(5).fill("white")));
      setAttempt(0);
      setGameOver(false);
      toast.success("Joined game successfully!");
    } catch (error) {
      toast.error("Failed to join game.");
      console.error("Error joining game:", error);
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
        player_id: playerId,
        guess: guesses[attempt].join("")
      });

      const { feedback, game_over, correct_word } = response.data;
      const newFeedback = [...feedbacks];
      newFeedback[attempt] = feedback;
      setFeedbacks(newFeedback);

      // if (game_over) {
      //   toast.info(`Waiting for opponent...`);
      //   setGameOver(true);
      // } else {
      //   setAttempt(attempt + 1);
      // }
  
      if (game_over) {
        toast.info(`Waiting for opponent...`);
        setGameOver(true);
      } else if ((feedback as string[]).every((color: string) => color === "green")) {
        // Player guessed correctly but game isn't over yet
        toast.success("Correct! Waiting for opponent...");
        setGameOver(true); // allow getResults button to show
      } else {
        setAttempt(attempt + 1);
      }
    } catch (error) {
      console.error("Error submitting guess:", error);
    }
  };

  // const getResults = async () => {
  //   try {
  //     const response = await axios.post(`${API_URL}/get-results`, { game_id: gameId });
  //     setResult(response.data);
  //   } catch (error) {
  //     toast.error("Error getting results.");
  //   }
  // };
  const getResults = async () => {
    try {
      const response = await axios.post(`${API_URL}/get-results`, {
        game_id: gameId,
        player_id: playerId,  // 🔑 Now passing playerId
      });
  
      setResult(response.data);
  
      if (response.data.winner === playerId && user) {
        await updateUserStats(user.uid, true); // User won
      } else if (user) {
        await updateUserStats(user.uid, false); // User lost
      }
    } catch (error) {
      toast.error("Error getting results.");
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
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw", background: "black", color: "white" }}>
      {!user ? (
        <button onClick={handleSignIn} style={{ position: "absolute", top: 20, right: 20 }}>Sign In</button>
      ) : (
        <button onClick={handleSignOut} style={{ position: "absolute", top: 20, right: 20 }}>Sign Out</button>
      )}

      {!playerId && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <button onClick={startNewGame}>Start New Game</button>
          <input type="text" placeholder="Enter Game ID" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
          <button onClick={joinExistingGame}>Join Game</button>
        </div>
      )}

      {playerId && gameId && (
        <p>You are in game <b>{gameId}</b>. Your player ID: <b>{playerId}</b></p>
      )}

      <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>Multiplayer Wordle</h1>

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
                  color: "black"
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {!gameOver && playerId && <button onClick={submitGuess} style={{ marginTop: "20px", padding: "10px" }}>Submit</button>}

      {gameOver && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={getResults}>Get Results</button>
          {result && result.winner && (
            <div>
              <h2>🏆 Winner: {result.winner}</h2>
              <p>Attempts: {result.attempts}</p>
              <p>Time Taken: {result.time_taken.toFixed(2)} seconds</p>
            </div>
          )}
          {result && result.message && <p>{result.message}</p>}
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default App;


