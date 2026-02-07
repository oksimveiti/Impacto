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

// 住所をGeoPointに変換する関数
async function getLocationData(address) {
  try {
    // アドレスが空の場合はデフォルト値を返す
    if (!address || address.trim() === "") {
      return {
        geopoint: new GeoPoint(0, 0),
        formatted_address: "",
        neighborhood: "",
        city: "",
        province: "",
      };
    }

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0];

          // 各コンポーネントの取得
          const getAddressComponent = (type) => {
            const component = location.address_components.find((comp) =>
              comp.types.includes(type)
            );
            return component ? component.long_name : "";
          };

          resolve({
            geopoint: new GeoPoint(
              location.geometry.location.lat(),
              location.geometry.location.lng()
            ),
            formatted_address: location.formatted_address,
            neighborhood:
              getAddressComponent("neighborhood") ||
              getAddressComponent("sublocality"),
            city: getAddressComponent("locality"),
            province: getAddressComponent("administrative_area_level_1"),
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Location processing failed: ${error.message}`);
  }
}

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
export async function saveEventToFirestore(eventData) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const locationData = await getLocationData(eventData.eventLocation);

    // 画像のアップロード処理を改善
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

    // 日時の処理を改善
    const event_start_date_time = new Date(eventData.eventStartDate);
    const event_end_date_time = new Date(eventData.eventEndDate);

    // 日時の妥当性チェック
    if (
      isNaN(event_start_date_time.getTime()) ||
      isNaN(event_end_date_time.getTime())
    ) {
      throw new Error("Invalid date/time format");
    }

    // イベントデータの保存
    const eventToSave = {
      title: eventData.eventTitle,
      address: locationData.formatted_address,
      province: locationData.province,
      city: locationData.city,
      neighborhood: locationData.neighborhood,
      event_start_date_time, // Dateオブジェクトとして保存
      event_end_date_time, // Dateオブジェクトとして保存
      petition_start_date_time: null,
      petition_end_date_time: null,
      description: eventData.eventDetails,
      event_categories: eventData.selectedCategory,
      image_url: imageUrl,
      max_participants: eventData.eventCapacity,
      participants: [],
      location: locationData.geopoint,
      organizer_email: user.email,
      organizer_id: user.uid,
      organizer_name: user.displayName || user.email,
      created_at: serverTimestamp(),
      type: eventData.type || "event",
      status: eventData.status || "draft",
      max_supporters: 0,
      supporters: [],
    };

    const docRef = await addDoc(collection(db, "events"), eventToSave);
    console.log("Document written with ID:", docRef.id);

    // ユーザーIDが存在する場合、適切なフィールドにイベントIDを追加
    if (eventData.userId) {
      const field =
        eventData.status === "draft" ? "drafts_events" : "hosting_events";
      await addEventToUserField(eventData.userId, docRef.id, field);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error in saveEventToFirestore:", error);
    throw error;
  }
}
