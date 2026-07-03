import speech_recognition as sr
import pyttsx3

# Initialize the Text-to-Speech engine
engine = pyttsx3.init()

def speak(text):
    print(f"Robot says: {text}")
    engine.say(text)
    engine.runAndWait()

# 1. Test Text-to-Speech (Robot speaks)
speak("Hello Junrey! I can talk now. Let me test my ears. Please say something after I say go.")
speak("Go!")

# 2. Test Voice-to-Text (Robot listens)
recognizer = sr.Recognizer()

with sr.Microphone() as source:
    # Adjust for background noise in the room
    recognizer.adjust_for_ambient_noise(source, duration=1)
    print("Listening... speak clearly into your laptop mic.")
    
    try:
        audio = recognizer.listen(source, timeout=5)
        print("Processing audio...")
        
        # Convert speech to text using Google's lightweight free API
        user_text = recognizer.recognize_google(audio)
        print(f"You said: {user_text}")
        
        # Respond back using Text-to-Speech
        speak(f"I heard you say: {user_text}. Our test is a complete success!")
        
    except sr.UnknownValueError:
        speak("Sorry, I could not understand the audio.")
    except sr.RequestError:
        speak("Could not request results; check your internet connection.")
    except sr.WaitTimeoutError:
        speak("I didn't hear anything.")