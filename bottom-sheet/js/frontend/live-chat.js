import { db, storage } from "../../../config/config.js";
import { doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, collection, serverTimestamp, deleteField, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// This is for use on pages other than the event details page.

// Obtain userID and Name
const userDataString = sessionStorage.getItem('userdata');
const userData = JSON.parse(userDataString);
const uid = userData.uid;

// Obtain eventorganizer Id
async function getOrganizerId(chatroomId){
  try {
    const eventDocRef = doc(db, "events", chatroomId);
    const eventDocSnapshot = await getDoc(eventDocRef);
    return eventDocSnapshot.exists() ? eventDocSnapshot.data().organizer_id : null;
  } catch (error) {
    return null;
  }
}

// Obtain chatroomId 
const localStorageChatroomId = localStorage.getItem("chatroomId");
const storedData = localStorageChatroomId ? JSON.parse(localStorageChatroomId) : null;
const defaultChatroomId = "default-room-id";
const chatroomId = storedData?.chatroomId ?? defaultChatroomId;

// Bottom sheet contents
const bottomSheetContainer = document.createElement("div");
bottomSheetContainer.id = "bottomSheetContainer";
bottomSheetContainer.innerHTML = `
  <div id=bottomSheet class="bottom-sheet">    
    <div class="sheet-header">    
      <h2 id="chatTitle" class="sheet-title"></h2>
      <button id="closeButton" class="close-button">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="sheet-body" id="chatArea"></div>      
    <div class="sheet-footer">
        <button type="button" id="removeFile" style="display: none;">X</button>
        <button type="button" id="menu" class="menu-button"><i class="fa-solid fa-bars"></i></button>
      <div class="input-area">
        <button type="button" id="cameraInput"><i class="fa-solid fa-camera"></i></button>
        <input type="file" id="imageInput" style="display: none;">
        <button type="button" id="imageSubmit"><i class="fa-solid fa-image"></i></button>
        <textarea class="textarea" id="textareaForm" cols="30" rows="10" placeholder="Join the conversation..."></textarea>
      </div>
      <div class="send-area">
        <button type="button" id="sendMedia" class="send-button"><i class="fa-solid fa-paper-plane"></i></button>
        <button type="button" id="sendText" class="send-button"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>
  </div>
`;

// Live Button element
const container = document.createElement('div');
container.classList.add('live-button-container');
const goLive = document.createElement('button');
goLive.id = 'goLive';
goLive.classList.add('live-chat', 'btn-blue');
const icon = document.createElement('i');
icon.classList.add('fa-regular', 'fa-comments');
const textNode = document.createTextNode('Live');
goLive.appendChild(icon);
goLive.appendChild(textNode);
container.appendChild(goLive);

// After Load HTML*************************************************
document.addEventListener("DOMContentLoaded", async() => {

  // 1. Insert DOMs
  // "Bottom Sheet"
  document.body.appendChild(bottomSheetContainer);

  // "Live Button"
  document.body.appendChild(container);

  const chatTitle = document.getElementById("chatTitle");
  const closeBtn = document.getElementById("closeButton");
  const menuBtn = document.getElementById("menu");
  const cameraInputBtn = document.getElementById("cameraInput");
  const imageInput = document.getElementById("imageInput");  
  const imageSubmitBtn = document.getElementById("imageSubmit");
  const textareaForm = document.getElementById("textareaForm");
  const sendBtnText = document.getElementById("sendText");
  const sendBtnMedia = document.getElementById("sendMedia");
  const bottomSheet = document.getElementById("bottomSheet");
  const goLiveBtn = document.getElementById("goLive");
  const inputArea = document.querySelector(".input-area");
  const removeFileBtn = document.getElementById("removeFile");


  // If chatroom was closed, live button is disappered.
  const storedDataString = localStorage.getItem("chatroomId");
  if (storedDataString) {
    try {
      const storedData = JSON.parse(storedDataString);
      const retrievedId = storedData.chatroomId;
      const docRef = doc(db, "chat_rooms", retrievedId);
      const docSnap = await getDoc(docRef);
      if(docSnap.exists()){
        const data = docSnap.data();
        if(!data.is_open){
          sessionStorage.removeItem("go_Live");
        }
      }       
    } catch (error) {
      console.error("JSON Parse error:", error);
    }
  }
  // Initialize "Go Live" button and "Bottom Sheet" statuses ***************
  async function initializeButtonState() {
    try {
      const goLiveString = sessionStorage.getItem("go_Live");
      const liveStatusObject = JSON.parse(goLiveString);
      const liveValue = liveStatusObject?.go_Live;
      if (liveValue === true) {
        goLiveBtn.classList.remove("deactive");
        bottomSheet.classList.remove("show");
      } else if(liveValue === false){
        goLiveBtn.classList.add("deactive");
        bottomSheet.classList.add("show");        
      } else {
        goLiveBtn.classList.add("deactive");
        return;
      }
    } catch (error) {
      console.error("Error initializing button state:", error);
    }
  };

  initializeButtonState();
    
  // Open bottom sheet by GoLiveBtn button
  goLiveBtn.addEventListener("click", async() => {
    bottomSheet.classList.add("show");
    goLiveBtn.classList.add("deactive");
    try{
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);    
      const eventData = eventDoc.data();
      const title = eventData.title;
 
      localStorage.setItem("chatroomId", JSON.stringify({ chatroomId: eventId}));
      localStorage.setItem("chatroomTitle", JSON.stringify({ chatroomTitle: title}));
      sessionStorage.setItem("go_Live", JSON.stringify({ go_Live: false }));
    } catch (error) {
      console.error("Errorr calling goLiveState:", error);
    }
  });    

  // Close bottom sheet by close button
  closeBtn.addEventListener("click", async() => {
    bottomSheet.classList.remove("show");
    goLiveBtn.classList.remove("deactive");
    try {
      sessionStorage.setItem("go_Live", JSON.stringify({ go_Live: true }));
    } catch (error){
      console.error("Errorr calling goLiveState:", error);
    }
  });

  // For "Bottom Sheet" input area behavior **********************************
  // When putting text
  if(textareaForm){
    textareaForm.addEventListener("focus", () => {
      menuBtn.style.display = "block";
      cameraInputBtn.style.display = "none";
      imageSubmitBtn.style.display = "none";
      sendBtnText.style.display = "block";
      sendBtnMedia.style.display = "none";
    });
  }      

  // When sending media file
  if(menuBtn){
    menuBtn.addEventListener("click", () => {
      menuBtn.style.display = "none";
      cameraInputBtn.style.display = "block";
      imageSubmitBtn.style.display = "block";
      sendBtnText.style.display = "none";
      sendBtnMedia.style.display = "block";
    });
  }

  // Transform timestamp
  async function formatDate(timestamp, retryCount = 0) {
    return new Promise((resolve, reject) => {
      if (!timestamp || typeof timestamp.toDate !== "function") {
        if (retryCount < 10) {
          setTimeout(() => {
            resolve(formatDate(timestamp, retryCount + 1));
          }, 100);
        } else {
          console.error("Invalid Timestamp:", timestamp);
          reject(new Error("Date format error"));
      }
        return;
    }      
    try {
        const date = timestamp.toDate();
        const formattedDate =
          date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }) +
          " " +
          date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });        
        resolve(formattedDate);
      } catch (error) {
        console.error("Date transform error:", error);
        reject(new Error("Date format error"));
      }
    });
  }

  
  // 2. "Live Chat" ******************************************************
  // 2-1. Update chat history 
  async function setupMessageListener(db, chatroomId) {
    try {
        const chatDocRef = doc(db, "chat_rooms", chatroomId);
        const chatRoomDoc = await getDoc(chatDocRef);

        if(!chatRoomDoc.exists()){
          return;
        }
        const title = chatRoomDoc.data().title;
        chatTitle.textContent = title;
        const messagesCollection = collection(chatDocRef, "messages");
        const q = query(messagesCollection, orderBy("timestamp"));
        onSnapshot(q, async (snapshot) => {
          const organizerId = await getOrganizerId(chatroomId);
          snapshot.docChanges().forEach(async (change) => {
              const msg = change.doc.data();
              const key = change.doc.id;
              if (!msg.timestamp) {
                  return;
              }
              if (change.type === "removed") {
                  const element = document.getElementById(key);
                  if (element) {
                      element.remove();
                  }
                  return;
              }
              try {
                  const userDocRef = doc(db, "users", msg.senderID);
                  const userDoc = await getDoc(userDocRef);
                  const userData = userDoc.data();
                  const userName = userData.name;
                  const formattedDate = await formatDate(msg.timestamp);
                  let h = `<div id="${key}">`;
                  h += `<p><span class="chat_name ${msg.senderID === uid? "chat_mine" : ""}">${userName}</span> ${formattedDate}`;
                  h += `<button class="remove-btn" data-key="${key}">remove</button></p>`;
                  if (msg.text) {
                      h += `${msg.text}`;
                  }
                  if (msg.mediaUrl) {
                      h += `<br><img src="${msg.mediaUrl}" alt="Image" class="chat-image">`;
                  }
                  if (msg.videoUrl) {
                      h += `<br><video controls style="max-width: 100%; height: auto;">
                                  <source src="${msg.videoUrl}" type="video/mp4">
                                  Your browser does not support the video tag.
                                  </video>`;
                  }
                  h += `</div>`;
                  const outputElement = document.getElementById("chatArea");
                  if (outputElement) {
                      outputElement.insertAdjacentHTML("beforeend", h);
                  }
                  document.querySelectorAll(".remove-btn").forEach((button) => {
                    if (organizerId === uid) {
                        button.style.display = "inline-block";
                    } else {
                        button.style.display = "none";
                    }
                });
              } catch (error) {
                  console.error("Date format error:", error);
              }
          });
          // Organizer can delete the comments by clicking "remove" button next to the comments.
          const chatArea = document.getElementById("chatArea");
          if (!chatArea.dataset.listenerAdded) {
              chatArea.addEventListener("click", async (event) => {
                  if (event.target.classList.contains("remove-btn")) {
                      const key = event.target.getAttribute("data-key");
                      await deleteMessage(db, chatroomId, key);
                  }
              });
              chatArea.dataset.listenerAdded = "true";
          }
        }, (error) => {
            console.error("Error getting messages:", error);
        });
    } catch (error) {
        console.error("Error setting up message listener:", error);
    }
  }

  if(chatroomId){
    setupMessageListener(db, chatroomId);
  }


  // 2-2. Post comment by click(send button)
  const lineHeight = 1.5;
  const maxLines = 10;
  const initialHeight = '1.5rem';
  // Initial text style
  textareaForm.style.height = initialHeight;
  textareaForm.style.overflowY = 'hidden';
  // TextareaForm expansion
  textareaForm.addEventListener("input", () => {
    const lines = textareaForm.value.split('\n');
    const currentLines = lines.length;
    if (currentLines <= maxLines) {
      textareaForm.style.height = `${currentLines * lineHeight}rem`;
    } else {
      textareaForm.value = lines.slice(0, maxLines).join('\n');
      textareaForm.style.height = `${maxLines * lineHeight}rem`;
    }
  });
  sendBtnText.addEventListener("click", async function () {
    const msg = {
      senderID: uid,
      text: textareaForm.value,
      timestamp: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "chat_rooms", chatroomId, "messages"), msg);
      textareaForm.value = ""; 
      textareaForm.style.height = initialHeight;
    } catch (error) {
      console.error("Failed to send a message:", error);
    }
  });
  
  // 2-3. Post the Photo & Video using camera - camera.html
  cameraInputBtn.addEventListener('click', () => {
    window.location.href = "/bottom-sheet/html/camera.html";
  });

  // 2-4. Post the photo & Video selecting existing data.
  // a. Move to select window
  let fileData = null;
  imageSubmitBtn.addEventListener("click", () => {
    imageInput.click();
    sendBtnText.style.display = "none";
    sendBtnMedia.style.display = "block";
  });

  // b. Select the file
  imageInput.addEventListener("change",(event) => {
    try {
      fileData = event.target.files[0];
      if(fileData){
        textareaForm.value = fileData.name;
        textareaForm.disabled = true;
        inputArea.style.pointerEvents = "none";
        cameraInputBtn.style.display = "none";
        imageSubmitBtn.style.display = "none";
        removeFileBtn.style.display = "block";
      } else {
        clearFileData();
      }
    } catch (error){
      console.error("imageInput change event error:", error);
    }
  });

  removeFileBtn.addEventListener("click", () => {
    clearFileData();
  });

  function clearFileData() {
    fileData = null;
    textareaForm.value = "";
    textareaForm.disabled = false;
    inputArea.style.pointerEvents = "auto";
    removeFileBtn.style.display = "none";
    imageInput.value = "";
    cameraInputBtn.style.display = "block";
    imageSubmitBtn.style.display = "block";
  }


  const cameraImageData = localStorage.getItem("cameraImageData");
  if (cameraImageData) {
    const byteString = atob(cameraImageData.split(",")[1]);
    const mimeString = cameraImageData.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    fileData = new Blob([ab], { type: mimeString });
    localStorage.removeItem("cameraImageData");
    sendBtnText.style.display = "none";
    sendBtnMedia.style.display = "block";

    textareaForm.value = "Camera Image";
    textareaForm.disabled = true;
    inputArea.style.pointerEvents = "none";
    cameraInputBtn.style.display = "none";
    imageSubmitBtn.style.display = "none";
    removeFileBtn.style.display = "block";
  }

  // c. Send the file to DB
  const sendMediaHandler = async () => { 
    if (!fileData) { 
        console.error("No file selected.");
        return;
    }
    const isPhoto = fileData.type.startsWith('image');
    const fileName = isPhoto
        ? `chat-images/${chatroomId}/photos/photo_${Date.now()}`
        : `chat-images/${chatroomId}/videos/video_${Date.now()}`;
    const storageRef = ref(storage, fileName);
    try {
        await uploadBytes(storageRef, fileData);
        const downloadURL = await getDownloadURL(storageRef);
        const messagesCollectionRef = collection(db, `chat_rooms/${chatroomId}/messages`);
        const dataToSave = {
            senderID: uid,
            timestamp: serverTimestamp(),
            mediaType: isPhoto ? "image" : "video",
            filePath: fileName,
        };
        if (isPhoto) {
            dataToSave.mediaUrl = downloadURL;
        } else {
            dataToSave.videoUrl = downloadURL;
        }
        await addDoc(messagesCollectionRef, dataToSave);
        clearFileData(); 
    } catch (error) {
        console.error("Failed to upload picture:", error);
    }
  };

  sendBtnMedia.addEventListener("click", sendMediaHandler);

  // 2-5 Delete message function for organizer
  async function deleteMessage(db, chatroomId, messageId) {
    try {
        const messageDocRef = doc(db, "chat_rooms", chatroomId, "messages", messageId);
        const messageData = (await getDoc(messageDocRef)).data();
        // Delete firestorage first.
        if (messageData && messageData.filePath) {
            const storageRef = ref(storage, messageData.filePath);
            await deleteObject(storageRef);
            console.log("Storage file deleted successfully:", messageData.filePath);
        }
        // Then, delete firestore.
        await deleteDoc(messageDocRef);
        console.log("Message deleted successfully:", messageId);
    } catch (error) {
        console.error("Error deleting message:", error);
        console.error("Failed to delete message:", error.message, error.stack);
    }
  }
});