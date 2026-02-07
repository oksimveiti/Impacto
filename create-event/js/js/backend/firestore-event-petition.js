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
export async function saveEventPetitionToFirestore(eventData) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const locationData = await getLocationData(eventData.eventLocation);

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

    // 日付と時間の処理
    const createDateTime = (date, time) => {
      if (!date || !time) return null;
      const [year, month, day] = date.split("-");
      const [hours, minutes] = time.split(":");
      return new Date(year, month - 1, day, hours, minutes);
    };

    // イベントと請願の日時を作成
    const eventStartDateTime = createDateTime(
      eventData.eventStartDate,
      eventData.eventStartTime
    );
    const eventEndDateTime = createDateTime(
      eventData.eventStartDate,
      eventData.eventEndTime
    );
    const petitionStartDateTime = createDateTime(
      eventData.petitionStartDate,
      eventData.petitionStartTime
    );
    const petitionEndDateTime = createDateTime(
      eventData.petitionEndDate,
      eventData.petitionEndTime
    );

    // Firestoreに保存するデータ
    const eventToSave = {
      title: eventData.eventTitle,
      address: locationData.formatted_address,
      province: locationData.province,
      city: locationData.city,
      neighborhood: locationData.neighborhood,
      // イベント情報
      event_start_date_time: eventStartDateTime,
      event_end_date_time: eventEndDateTime,
      max_participants: parseInt(eventData.eventCapacity) || 0,
      participants: [],
      // 請願情報
      petition_start_date_time: petitionStartDateTime,
      petition_end_date_time: petitionEndDateTime,
      max_supporters: parseInt(eventData.petitionTarget) || 0,
      supporters: [],
      description: eventData.eventDetails,
      event_categories: eventData.selectedCategory,
      image_url: imageUrl,
      location: locationData.geopoint,
      organizer_email: user.email,
      organizer_id: user.uid,
      organizer_name: user.displayName || user.email,
      created_at: serverTimestamp(),
      type: "event_petition",
      status: eventData.status || "draft",
    };

    const docRef = await addDoc(collection(db, "events"), eventToSave);

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
