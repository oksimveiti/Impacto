import { db, auth, storage } from "../../../config/config.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const eventId = sessionStorage.getItem("eventId");

// Obtain HTMl Information
const video = document.getElementById('camera-view');
const canvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
const recordedVideo = document.getElementById('recorded-video');
const photoBtn = document.getElementById('photo-btn');
const videoBtn = document.getElementById('video-btn');
const stopBtn = document.getElementById('stop-btn');
const uploadBtn = document.getElementById('upload-btn');
const message = document.getElementById('message');
let mediaRecorder;
let recordedChunks = [];
let fileData = null;

// Set up Camera
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        video.srcObject = stream;
        //MediaRecorder Setting
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' });
            recordedChunks = [];
            fileData = blob;
            // Confirm the file size < 100MB to store on firestorage
            if (blob.size > 100 * 1024 * 1024) {
                message.innerText = "The file size should be under 100MB. Please download to your device";
                recordedVideo.src = URL.createObjectURL(blob);
            } else {
                recordedVideo.src = URL.createObjectURL(blob);
                message.innerText = "You can upload the file";
            }
            photo.style.display = 'none';
            recordedVideo.style.display = 'block';
        };
    })
    .catch(error => {
        console.error('Failed to set up camera:', error);
    });

// Taking a photo
photoBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        fileData = blob;
        photo.src = URL.createObjectURL(blob);
        // Confirm the file size < 5MB to store on firestorage
        if (blob.size > 5 * 1024 * 1024) {
            message.innerText = "The file size should be under 5MB. Please download to your device";
        } else {
            message.innerText = "You can upload the file";
        }
        recordedVideo.style.display = 'none';
        photo.style.display = 'block';
    }, 'image/png');
});

// Start video recording
videoBtn.addEventListener('click', () => {
    recordedChunks = [];
    mediaRecorder.start();
    videoBtn.disabled = true;
    stopBtn.disabled = false;
    message.innerText = "recording...";
});

// Stop video recording
stopBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    videoBtn.disabled = false;
    stopBtn.disabled = true;
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        const currentUid = user.uid;
        console.log("User ID:", currentUid);

        // Upload the file to firestorage
        uploadBtn.addEventListener('click', async () => {
            if (!fileData) {
                message.innerText = "No data for upload";
                return;
            }
            const chatRoomId = eventId;
            const isPhoto = fileData.type.startsWith('image');
            const fileName = isPhoto
                ? `chat-images/${eventId}/photos/photo_${Date.now()}`
                : `chat-images/${eventId}/videos/video_${Date.now()}`;
            const storageRef = ref(storage, fileName);

            try {
                await uploadBytes(storageRef, fileData);
                const downloadURL = await getDownloadURL(storageRef);
                const messagesCollection = collection(db, `chat_rooms/${chatRoomId}/messages`);
                const dataToSave = {
                    senderID: currentUid,
                    timestamp: serverTimestamp(),
                    mediaType: isPhoto ? "image" : "video",
                    filePath: fileName,
                };

                if (isPhoto) {
                    dataToSave.mediaUrl = downloadURL;
                } else {
                    dataToSave.videoUrl = downloadURL;
                }

                await addDoc(messagesCollection, dataToSave);

                message.innerHTML = `Uploaded successfully 🎉 <br> <a href="${downloadURL}" target="_blank">Download</a>`;
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    localStorage.setItem("cameraImageData", base64data);
                    window.history.back();
                };
                reader.readAsDataURL(fileData);
            } catch (error) {
                console.error("Upload error:", error);
                message.innerText = "Failed to upload";
            }
        });
    } else {
        console.log("User does not login");
        console.log(null);
    }
});

const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', () => {
    window.history.back();
});