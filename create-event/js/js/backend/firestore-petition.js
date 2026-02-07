import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  GeoPoint,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  doc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "../../../../config/config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// ユーザーのイベントIDを適切なフィールドに追加する関数
async function addEventToUserField(userId, eventId, field) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [field]: arrayUnion(eventId),
    });
    console.log(`Successfully added event to user's ${field} array`);
  } catch (error) {
    console.error(`Error adding event to user's ${field}:`, error);
    throw error;
  }
}

// Firestoreにイベントを保存する関数
export async function savePetitionToFirestore(eventData) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // 画像アップロード処理
    let imageUrl = null;
    if (eventData.eventImage) {
      try {
        console.log("Starting image upload process");

        // Base64データからプレフィックスを削除
        const base64Data = eventData.eventImage.split(",")[1];
        // Base64をBlobに変換
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const blob = new Blob([new Uint8Array(byteArrays)], {
          type: "image/jpeg",
        });

        // Storageに保存
        const imageRef = ref(storage, `event-images/${Date.now()}-${user.uid}`);
        const uploadResult = await uploadBytes(imageRef, blob);

        // 画像のURLを取得
        imageUrl = await getDownloadURL(uploadResult.ref);
        console.log("Image uploaded successfully:", imageUrl);
      } catch (imageError) {
        console.error("Error uploading image:", imageError);
        throw new Error(`Image upload failed: ${imageError.message}`);
      }
    }

    // 日付と時間の処理を修正
    const createDateTime = (date, time) => {
      if (!date || !time) return null;
      const [year, month, day] = date.split("-");
      const [hours, minutes] = time.split(":");
      return new Date(year, month - 1, day, hours, minutes);
    };

    // イベントと請願の日時を作成
    const petitionStartDateTime = createDateTime(
      eventData.petition_start_date,
      eventData.petition_start_time
    );
    const petitionEndDateTime = createDateTime(
      eventData.petition_end_date,
      eventData.petition_end_time
    );

    // Firestoreに保存するデータ
    const eventToSave = {
      title: eventData.eventTitle,
      address: "",
      province: "",
      city: "",
      neighborhood: "",
      // イベント情報
      event_start_date_time: null,
      event_end_date_time: null,
      max_participants: 0,
      participants: [],
      // 請願情報
      petition_start_date_time: petitionStartDateTime,
      petition_end_date_time: petitionEndDateTime,
      max_supporters: parseInt(eventData.petitionTarget) || 0,
      supporters: [],
      description: eventData.eventDetails,
      event_categories: eventData.selectedCategory,
      image_url: imageUrl,
      ...(eventData.latitude && eventData.longitude
        ? { location: new GeoPoint(eventData.latitude, eventData.longitude) }
        : {}),
      organizer_email: user.email,
      organizer_id: user.uid,
      organizer_name: user.displayName || user.email,
      created_at: serverTimestamp(),
      type: "petition",
      status: eventData.status || "draft",
    };

    const docRef = await addDoc(collection(db, "events"), eventToSave);
    console.log("Document written with ID: ", docRef.id); // デバッグ用

    if (eventData.userId) {
      const field =
        eventData.status === "draft" ? "drafts_events" : "hosting_events";
      await addEventToUserField(eventData.userId, docRef.id, field);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error in saveEventPetitionToFirestore:", error);
    throw error;
  }
}
