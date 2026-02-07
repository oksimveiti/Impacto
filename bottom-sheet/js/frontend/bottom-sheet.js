import { db, storage } from "../../../config/config.js";
import { doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, collection, serverTimestamp, deleteField, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// This is for the event, event & petition detail page 

// Obtain userID and Name
const userDataString = sessionStorage.getItem('userdata');
const userData = JSON.parse(userDataString);
const uid = userData.uid;

// Obtain eventId
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("id");

// Obtain eventorganizer Id
async function getOrganizerId(eventId){
  try {
    const eventDocRef = doc(db, "events", eventId);
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
export const bottomSheetContainer = document.createElement("div");
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
export const container = document.createElement('div');
container.classList.add('live-button-container');
const goLive = document.createElement('button');
goLive.id = 'goLive';
goLive.classList.add('live-chat', 'btn-blue', 'deactive');
const icon = document.createElement('i');
icon.classList.add('fa-regular', 'fa-comments');
const textNode = document.createTextNode('Live');
goLive.appendChild(icon);
goLive.appendChild(textNode);
container.appendChild(goLive);


// Wait for loading
document.addEventListener("DOMContentLoaded", async() => {

  // 1. Insert DOMs
  // "Bottom Sheet"
  document.body.appendChild(bottomSheetContainer);

  // "Live Button"
  document.body.appendChild(container);

  // "Active button" and "Deactive button"
  const actionBtns = document.querySelector('.action-buttons');
  if (actionBtns) {
    const supportButton = document.getElementById('supportButton');
    const attendButton = document.getElementById('attendButton');
    if (attendButton) {
      const deactiveBtn = document.createElement('button');
      deactiveBtn.id = 'deactiveBtn';
      deactiveBtn.classList.add('deactive', 'btn-blue');
      deactiveBtn.textContent = 'Deactive Chat';
      actionBtns.insertBefore(deactiveBtn, supportButton);
      deactiveBtn.style.display = "none";
      const activeBtn = document.createElement('button');
      activeBtn.id = 'activeBtn';
      activeBtn.classList.add('active', 'btn-blue');
      activeBtn.textContent = 'Active Chat';
      actionBtns.insertBefore(activeBtn, deactiveBtn);
      activeBtn.style.display = "none";
    } else {
      console.error('No "attendButton"');
    }
  } else {
    console.error('No ".action-buttons"');
  }
  
  // 2. Retrieving a DOM by IDs
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
  const activeLiveBtn = document.getElementById("activeBtn");
  const deactiveLiveBtn = document.getElementById("deactiveBtn");
  // const attendButton = document.getElementById("attendButton");
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
  // 3. Status as default and change by event listener
  async function initializeButtonState() {
    try {
      const docRef = doc(db, "chat_rooms", eventId);
      const docSnap = await getDoc(docRef);
      const organizerId = await getOrganizerId(eventId);
      
      // For organizer
      if (organizerId !== null && organizerId === uid) {
        activeLiveBtn.style.display = "block";
        deactiveLiveBtn.style.display = "block";
        if(docSnap.exists()){
          const data = docSnap.data();
          if(data.is_open){
            showDeactive();
            goLiveBtn.classList.remove("deactive");
          } else {
            showActive();
          }            
        }
      // For other user
      } else {
        activeLiveBtn.style.display = "none";
        deactiveLiveBtn.style.display = "none";
        if(docSnap.exists()){
          const data = docSnap.data();
          if(data.is_open){
            goLiveBtn.classList.remove("deactive");
          } 
        }
      } 
      
      // Keep status from other page
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
        return;
      }

    } catch (error) {
      console.error("Error initializing button state:", error);
    }
  }
  
  initializeButtonState();

  // The function to change display
  // For "Active" button and "Deactive" button
  function showActive() {
    activeLiveBtn.style.display = "block";
    deactiveLiveBtn.style.display = "none";
  }
  
  function showDeactive() {
    activeLiveBtn.style.display = "none";
    deactiveLiveBtn.style.display = "block";
  }
  
  // Generate Chat-box on firestore and firestorage
  // And, display "Go Live" button
  activeLiveBtn.addEventListener("click", async function(){
    if(confirm('Are you ready to open chat?')){
      alert('Chat room was opened!');
      showDeactive();
      goLiveBtn.classList.remove("deactive");
      openChatRoom(db, eventId);
      createChatImagesFolder(eventId);
    } else {
      alert("Cancelled open chatroom.")
    }
  });    

  // Hide "Go Live" button
  // Remove chat-box (cut access to DB, but not delete chat)
  deactiveLiveBtn.addEventListener("click", ()=> {
    if(confirm('Are you ready to close chat?')){
      alert('Chat room was closed');
      showActive();
      goLiveBtn.classList.add("deactive");
      closeChatRoom(db, eventId);
    } else {
      alert("Cancelled close chatroom.")
    }
  }); 

  // When change was happened, reflect soon.
  const docRef = doc(db, "chat_rooms", eventId);
  onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      if (data.is_open) {
        goLiveBtn.classList.remove("active");
      } else {
        goLiveBtn.classList.add("active");
      }
    }
  });

  // Open bottom sheet by GoLiveBtn button
  goLiveBtn.addEventListener("click", async() => {
    bottomSheet.classList.add("show");
    goLiveBtn.classList.add("deactive");
    try{
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);    
      const eventData = eventDoc.data();
      const title = eventData.title;
      const chatDocRef = doc(db, "chat_rooms", eventId);
      const chatRoomDoc = await getDoc(chatDocRef);
      if(chatRoomDoc.data().is_open){
        localStorage.setItem("chatroomId", JSON.stringify({ chatroomId: eventId}));
        localStorage.setItem("chatroomTitle", JSON.stringify({ chatroomTitle: title}));
      }
      sessionStorage.setItem("go_Live", JSON.stringify({ go_Live: false }));
      window.location.reload();
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

  // For bottom sheet input area behavior
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

  // Generate Chat-box on firestore
  async function openChatRoom(db, eventId) {
    try {
        const eventDocRef = doc(db, "events", eventId);
        const eventDoc = await getDoc(eventDocRef);    
        if(eventDoc.exists()){
          const eventData = eventDoc.data();
          const title = eventData.title;
          const organizer = eventData.organizer_id;
          const chatroomDocRef = doc(db, "chat_rooms", eventId);
          await setDoc(chatroomDocRef, {
            title: title,
            organizer: organizer,
            createdAt: serverTimestamp(),
            is_open: true,
        });
          const messagesCollectionRef = collection(chatroomDocRef, "messages");
          const messageRef = await addDoc(messagesCollectionRef, {
            senderID: eventData.organizer_id,
            text: "Event starting soon! Get ready to engage and connect with fellow attendees!!",
            timestamp: serverTimestamp(),
        });
          console.log("Message added to chatroom successfully! Message ID:", messageRef.id);
        } else {
          console.log("Event document not found!");
      }
      } catch (error) {
        console.error("Error copying event data to chatroom:", error);
    }
  }

  // Generate chat-images folder on firestorage
  async function createChatImagesFolder() {
    try {
        const filePath = `chat-images/${eventId}/.keep`;
        const storageRef = ref(storage, filePath);
        const blob = new Blob(["Folder placeholder"], { type: "text/plain" });
        await uploadBytes(storageRef, blob);
        console.log(`Created folder: chat-images/${eventId}/`);
      } catch (error) {
        console.error("Failed to create folder:", error);
        if (error.code === "storage/unauthorized") {
          alert("There is no access");
        } else {
          alert("Failed to create folder");
        }
    }
  };

  // Change status of chat_room. Make user enalbled access.
  async function closeChatRoom(db, eventId){
    try {
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);    
      if(eventDoc.exists()){
        const chatroomDocRef = doc(db, "chat_rooms", eventId);
        await updateDoc(chatroomDocRef, {
          is_open: false,
      });
      } else {
        console.log("Event document not found!");
    }
    } catch (error) {
      console.error("Error:", error);
    }
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

  // Keep chatroom Id till override when user click "Live"button on another page.
  // const storedDataString = localStorage.getItem("chatroomId");
  if (storedDataString) {
    try {
      const storedData = JSON.parse(storedDataString);
      const retrievedId = storedData.chatroomId;
      setupMessageListener(db, retrievedId)
    } catch (error) {
      console.error("JSON Parse error:", error);
    }
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
        ? `chat-images/${eventId}/photos/photo_${Date.now()}`
        : `chat-images/${eventId}/videos/video_${Date.now()}`;
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