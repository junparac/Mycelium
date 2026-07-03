import cv2
import face_recognition

# Open the laptop's built-in webcam (0 is usually the default camera)
video_capture = cv2.VideoCapture(0)

print("Press 'q' on your keyboard to quit the video window.")

while True:
    # Grab a single frame of video
    ret, frame = video_capture.read()
    if not ret:
        break

    # Find all the faces and face encodings in the current frame of video
    # We use 'hog' because it is much faster on standard laptop CPUs
    face_locations = face_recognition.face_locations(frame, model="hog")

    # Draw a green box around each detected face
    for (top, right, bottom, left) in face_locations:
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        
        # This is where your robot logic will live later!
        # Instead of just drawing a box, you will send a UART command here.
        # print("Face Detected! Sending command to robot body...")

    # Display the resulting image window
    cv2.imshow('Laptop Webcam AI Test', frame)

    # Hit 'q' on the keyboard to quit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam hardware and close the window cleanly
video_capture.release()
cv2.destroyAllWindows()