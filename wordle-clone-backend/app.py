# from flask import Flask, request, jsonify
# import random
# import uuid
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)

# # Sample list of 5-letter words (Replace with a larger dataset)
# WORDS = ["apple", "grape", "table", "chair", "brick", "flame", "sweet"]

# # Store active games in memory 
# games = {}

# @app.route('/start-game', methods=['GET'])
# def start_game():
#     """Starts a new game session and returns a game ID."""
#     game_id = str(uuid.uuid4())
#     word = random.choice(WORDS)
#     games[game_id] = {"word": word, "attempts": 0, "max_attempts": 5}
#     return jsonify({"game_id": game_id})

# @app.route('/submit-guess', methods=['POST'])
# def submit_guess():
#     """Receives a guess and returns feedback."""
#     data = request.json
#     game_id = data.get("game_id")
#     guess = data.get("guess")
    
#     if not game_id or not guess:
#         return jsonify({"error": "Game ID and guess are required."}), 400
    
#     if game_id not in games:
#         return jsonify({"error": "Invalid game ID."}), 400
    
#     game = games[game_id]
#     word = game["word"]
#     attempts = game["attempts"]
#     max_attempts = game["max_attempts"]
    
#     if attempts >= max_attempts:
#         return jsonify({"error": "Maximum attempts reached."}), 400
    
#     feedback = ["white"] * 5  # Default feedback
#     word_list = list(word)
    
#     # Check for correct positions first
#     for i in range(5):
#         if guess[i] == word[i]:
#             feedback[i] = "green"  # Correct letter and position
#             word_list[i] = None  # Mark as used
    
#     # Check for misplaced letters
#     for i in range(5):
#         if feedback[i] == "green":
#             continue
#         if guess[i] in word_list:
#             feedback[i] = "yellow"  # Correct letter, wrong position
#             word_list[word_list.index(guess[i])] = None  # Mark as used
#         else:
#             feedback[i] = "red"  # Incorrect letter
    
#     game["attempts"] += 1
#     game_over = game["attempts"] >= max_attempts or guess == word
    
#     return jsonify({
#         "feedback": feedback,
#         "game_over": game_over,
#         "correct_word": word if game_over else None
#     })

# if __name__ == '__main__':
#     app.run(debug=True)

from flask import Flask, request, jsonify
import random
import uuid
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

WORDS = ["apple", "grape", "table", "chair", "brick", "flame", "sweet"]
games = {}

@app.route('/start-game', methods=['GET'])
def start_game():
    game_id = str(uuid.uuid4())
    player_id = str(uuid.uuid4())
    word = random.choice(WORDS)
    games[game_id] = {
        "word": word,
        "players": {
            player_id: {
                "attempts": 0,
                "completed": False,
                "guesses": [],
                "start_time": time.time(),
                "end_time": None
            }
        },
        "max_attempts": 5,
        "started": True
    }
    return jsonify({"game_id": game_id, "player_id": player_id})

@app.route('/join-game', methods=['POST'])
def join_game():
    data = request.json
    game_id = data.get("game_id")

    if game_id not in games:
        return jsonify({"error": "Invalid game ID."}), 400

    if len(games[game_id]["players"]) >= 2:
        return jsonify({"error": "Game already has 2 players."}), 400

    player_id = str(uuid.uuid4())
    games[game_id]["players"][player_id] = {
        "attempts": 0,
        "completed": False,
        "guesses": [],
        "start_time": time.time(),
        "end_time": None
    }
    return jsonify({"player_id": player_id})

@app.route('/submit-guess', methods=['POST'])
def submit_guess():
    data = request.json
    game_id = data.get("game_id")
    player_id = data.get("player_id")
    guess = data.get("guess")

    if not game_id or not player_id or not guess:
        return jsonify({"error": "Game ID, player ID, and guess are required."}), 400

    if game_id not in games or player_id not in games[game_id]["players"]:
        return jsonify({"error": "Invalid game or player ID."}), 400

    game = games[game_id]
    player = game["players"][player_id]
    word = game["word"]

    if player["completed"]:
        return jsonify({"error": "Player already completed the game."}), 400

    if player["attempts"] >= game["max_attempts"]:
        player["completed"] = True
        return jsonify({"error": "Maximum attempts reached."}), 400

    feedback = ["white"] * 5
    word_list = list(word)

    for i in range(5):
        if guess[i] == word[i]:
            feedback[i] = "green"
            word_list[i] = None

    for i in range(5):
        if feedback[i] == "green":
            continue
        if guess[i] in word_list:
            feedback[i] = "yellow"
            word_list[word_list.index(guess[i])] = None
        else:
            feedback[i] = "red"

    player["attempts"] += 1
    player["guesses"].append(guess)

    if guess == word or player["attempts"] >= game["max_attempts"]:
        player["completed"] = True
        player["end_time"] = time.time()

    game_over = all(p["completed"] for p in game["players"].values())

    return jsonify({
        "feedback": feedback,
        "game_over": game_over,
        "correct_word": word if game_over else None
    })

# @app.route('/get-results', methods=['POST'])
# def get_results():
#     data = request.json
#     game_id = data.get("game_id")

#     if game_id not in games:
#         return jsonify({"error": "Invalid game ID."}), 400

#     game = games[game_id]
#     players = game["players"]

#     if not all(p["completed"] for p in players.values()):
#         return jsonify({"message": "Game still in progress."})

#     completed_players = {
#         pid: p for pid, p in players.items()
#         if p["guesses"] and p["guesses"][-1] == game["word"]
#     }

#     if not completed_players:
#         return jsonify({"message": "No winner."})

#     sorted_players = sorted(
#         completed_players.items(),
#         key=lambda item: (item[1]["attempts"], item[1]["end_time"] - item[1]["start_time"])
#     )
#     winner_id, winner_data = sorted_players[0]

#     return jsonify({
#         "winner": winner_id,
#         "attempts": winner_data["attempts"],
#         "time_taken": winner_data["end_time"] - winner_data["start_time"]
#     })

@app.route('/get-results', methods=['POST'])
def get_results():
    data = request.json
    game_id = data.get("game_id")
    player_id = data.get("player_id")

    if game_id not in games:
        return jsonify({"error": "Invalid game ID."}), 400

    game = games[game_id]
    players = game["players"]
    word = game["word"]

    if player_id not in players:
        return jsonify({"error": "Invalid player ID."}), 400

    current_player = players[player_id]

    # Check if the requesting player has guessed the word
    if not any(g == word for g in current_player["guesses"]):
        return jsonify({"message": "You haven't guessed the word yet."})

    # Check if the other player is done (guessed correctly or reached max attempts)
    other_players = {
        pid: p for pid, p in players.items() if pid != player_id
    }

    if not all(
        any(g == word for g in p["guesses"]) or p["attempts"] >= game["max_attempts"]
        for p in other_players.values()
    ):
        return jsonify({"message": "Waiting for other player to finish."})

    # Select winner from all players who guessed correctly
    winning_players = {
        pid: p for pid, p in players.items()
        if any(g == word for g in p["guesses"])
    }

    sorted_players = sorted(
        winning_players.items(),
        key=lambda item: (item[1]["attempts"], item[1]["end_time"] - item[1]["start_time"])
    )
    winner_id, winner_data = sorted_players[0]

    return jsonify({
        "winner": winner_id,
        "attempts": winner_data["attempts"],
        "time_taken": winner_data["end_time"] - winner_data["start_time"]
    })

if __name__ == '__main__':
    app.run(debug=True)

# {
#     "game_id": "b06e00c6-1ed4-4df8-8aa2-4e22d8206ef5",
#     "player_id": "0a9b4e8b-30e6-482e-b703-877af0f92fb0"
# }

# {
#     "game_id": "b06e00c6-1ed4-4df8-8aa2-4e22d8206ef5",
#     "player_id": "865a11a1-cef6-4027-952a-36cceed1ed93"
# }
