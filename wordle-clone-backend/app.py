from flask import Flask, request, jsonify
import random
import uuid
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Sample list of 5-letter words (Replace with a larger dataset)
WORDS = ["apple", "grape", "table", "chair", "brick", "flame", "sweet"]

# Store active games in memory 
games = {}

@app.route('/start-game', methods=['GET'])
def start_game():
    """Starts a new game session and returns a game ID."""
    game_id = str(uuid.uuid4())
    word = random.choice(WORDS)
    games[game_id] = {"word": word, "attempts": 0, "max_attempts": 5}
    return jsonify({"game_id": game_id})

@app.route('/submit-guess', methods=['POST'])
def submit_guess():
    """Receives a guess and returns feedback."""
    data = request.json
    game_id = data.get("game_id")
    guess = data.get("guess")
    
    if not game_id or not guess:
        return jsonify({"error": "Game ID and guess are required."}), 400
    
    if game_id not in games:
        return jsonify({"error": "Invalid game ID."}), 400
    
    game = games[game_id]
    word = game["word"]
    attempts = game["attempts"]
    max_attempts = game["max_attempts"]
    
    if attempts >= max_attempts:
        return jsonify({"error": "Maximum attempts reached."}), 400
    
    feedback = ["white"] * 5  # Default feedback
    word_list = list(word)
    
    # Check for correct positions first
    for i in range(5):
        if guess[i] == word[i]:
            feedback[i] = "green"  # Correct letter and position
            word_list[i] = None  # Mark as used
    
    # Check for misplaced letters
    for i in range(5):
        if feedback[i] == "green":
            continue
        if guess[i] in word_list:
            feedback[i] = "yellow"  # Correct letter, wrong position
            word_list[word_list.index(guess[i])] = None  # Mark as used
        else:
            feedback[i] = "red"  # Incorrect letter
    
    game["attempts"] += 1
    game_over = game["attempts"] >= max_attempts or guess == word
    
    return jsonify({
        "feedback": feedback,
        "game_over": game_over,
        "correct_word": word if game_over else None
    })

if __name__ == '__main__':
    app.run(debug=True)
