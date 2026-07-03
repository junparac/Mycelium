import cv2
import face_recognition
import win32com.client
from datetime import datetime
import os
import random

# Initialize native Windows Speech API (No more pyttsx3 freezing!)
speaker = win32com.client.Dispatch("SAPI.SpVoice")

# Vault directory setup
VAULT_DIR = r"C:\Users\ASUS\Documents\MyceliumVault"
LOG_FILE_PATH = os.path.join(VAULT_DIR, "face_detection_logs.md")

# Randomized greeting lists
junrey_greetings = [
    "Hello Junrey! Welcome back to the lab.",
    "Welcome back Junrey.",
    "Good to see you again.",
    "Back in the lab already?",
    "Ready for another project?"
]

niko_greetings = [
    "Hi Niko! Nice to see you.",
    "Hello Niko!",
    "Hey buddy!",
    "Welcome back Niko!"
]

shiella_greetings = [
    "Hi Beautiful! Nice to see you.",
    "Hello Shiella!",
    "Welcome home Shiella.",
    "Hope you're having a wonderful day."
]

def log_face_detection(name, status="Detected"):
    """Appends a new face detection event to the Obsidian markdown table safely."""
    if not os.path.exists(VAULT_DIR):
        print(f"Error: The directory {VAULT_DIR} does not exist.")
        return

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    file_exists = os.path.exists(LOG_FILE_PATH)
    
    with open(LOG_FILE_PATH, "a", encoding="utf-8") as file:
        if not file_exists:
            file.write("# Face Recognition - Live Detection Logs\n\n")
            file.write("| Timestamp | Person Recognized | Status |\n")
            file.write("| --- | --- | --- |\n")
        
        new_row = f"| {timestamp} | {name} | {status} |\n"
        file.write(new_row)
        
def speak(text):
    print(f"Robot says: {text}")
    speaker.Speak(text, 1)  # 1 = Asynchronous background talk

# Load reference pictures
try:
    junrey_image = face_recognition.load_image_file("junrey.jpg")
    niko_image = face_recognition.load_image_file("niko.jpg")
    shiella_image = face_recognition.load_image_file("shiella.jpg")
    
    junrey_face_encoding = face_recognition.face_encodings(junrey_image)[0]
    niko_face_encoding = face_recognition.face_encodings(niko_image)[0]
    shiella_face_encoding = face_recognition.face_encodings(shiella_image)[0]
    print("Reference images loaded successfully!")
except IndexError:
    print("Error: Could not find a face in one of the images.")
    exit()
except FileNotFoundError:
    print("Error: One of the image files was not found.")
    exit()

known_face_encodings = [junrey_face_encoding, niko_face_encoding, shiella_face_encoding]
known_face_names = ["Junrey", "Niko", "shiella"]

# SYSTEM CORE STATE MEMORY
# We track whether a greeting has been delivered. We only allow a new greeting
# if the room goes completely empty first.
greeting_delivered = False 

# Initialize drawing variables to prevent early loop crashes
face_locations = []
current_frame_names = []

# Open webcam
video_capture = cv2.VideoCapture(0)
process_this_frame = 0

while True:
    ret, frame = video_capture.read()
    if not ret:
        break

    # Only process the heavy AI calculations once every 4 frames
    if process_this_frame % 4 == 0:
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        
        face_locations = face_recognition.face_locations(small_frame, model="hog")
        face_encodings = face_recognition.face_encodings(small_frame, face_locations)
        
        current_frame_names = []
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
            name = "Unknown"
            if True in matches:
                name = known_face_names[matches.index(True)]
            current_frame_names.append(name)

        # === FLAWLESS SPEECH TRIGGER LOGIC ===
        if current_frame_names:
            primary_person = current_frame_names[0]  

            # Rule: Only speak if a greeting hasn't been delivered yet AND they are a recognized user
            if not greeting_delivered and primary_person in known_face_names:
                
                if primary_person == "Junrey":
                    greeting = random.choice(junrey_greetings)
                    speak(greeting)
                    log_face_detection("Junrey", greeting)
                elif primary_person == "Niko":
                    greeting = random.choice(niko_greetings)
                    speak(greeting)
                    log_face_detection("Niko", greeting)
                elif primary_person == "shiella":
                    greeting = random.choice(shiella_greetings)
                    speak(greeting)
                    log_face_detection("shiella", greeting)  

                # Lock greetings immediately. No more chatting until the room empties.
                greeting_delivered = True
        else:
            # ROOM IS EMPTY: Reset the trigger. Next person to walk in gets a greeting!
            greeting_delivered = False

    process_this_frame += 1

    # Scale the face box locations back up to match full-size webcam window
    for (top, right, bottom, left), name in zip(face_locations, current_frame_names):
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        color = (0, 255, 0) if name in known_face_names else (0, 0, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 1)

    cv2.imshow('Laptop Webcam AI Recognition & Voice', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()