import { auth } from "../../../config/config.js";
import { STORAGE_KEYS, storageHelpers } from "../backend/storage-helpers.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const LIMITS = {
  MAX_BIO_LENGTH: 500,
  MAX_HOBBIES: 10,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
};

document.addEventListener("DOMContentLoaded", function () {
  // Setup auth state listener
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Current user:", user);

    if (!user) {
      console.log("No user found - redirecting to login");
      window.location.href =
        "../../../authentication-Francisco/html/log-in.html";
      return;
    }

    // Display user information
    if (user) {
      const userInfo = document.getElementById("userInfo");
      if (userInfo) {
        userInfo.textContent = `Test to make sure auth is working, your User ID: ${user.uid}, Email: ${user.email}, Display Name: ${user.displayName}`;
        userInfo.style.fontSize = ".8rem";
        userInfo.style.color = "hotpink";
        userInfo.style.marginTop = "10px";
        userInfo.style.marginBottom = "10px";
      }

      // Initialize page after authentication check
      initializeProfileSetup(user);
    }
  });

  // Clean up the listener when page is unloaded
  window.addEventListener("unload", () => {
    unsubscribe();
  });
});

//
function initializeProfileSetup(user) {
  // Get all the elements we need
  const elements = {
    // Basic Info Section
    profilePicInput: document.getElementById("profilePicture"),
    profilePreview: document.getElementById("profilePreview"),
    bioTextarea: document.getElementById("bio"),
    bioCount: document.getElementById("bioCount"),
    genderSelect: document.getElementById("gender"),

    // Interests Section
    hobbyInput: document.getElementById("hobby-1"),
    addHobbyButton: document.querySelector(".add-hobby"),
    hobbiesDisplay: document.getElementById("hobbiesDisplay"),
    eventPreferences: document.getElementById("eventPreferences"),

    // Preferences Section
    notificationsSelect: document.getElementById("notifications"),
    privacySelect: document.getElementById("privacy"),

    // Location Section
    locationTypeSelect: document.getElementById("locationType"),
    getLocationButton: document.getElementById("getLocation"),
    gpsStatus: document.getElementById("gpsStatus"),
    manualAddress: document.getElementById("address"),

    // UI Elements
    reviewButton: document.getElementById("reviewProfile"),
    errorDisplay: document.getElementById("errorDisplay"),
  };

  function loadSavedData() {
    // Load profile picture
    const savedProfilePic = storageHelpers.get(STORAGE_KEYS.PROFILE_PIC);
    if (savedProfilePic && elements.profilePreview) {
      elements.profilePreview.src = savedProfilePic;
      elements.profilePreview.style.display = "block";
      elements.profilePreview.style.width = "150px";
      elements.profilePreview.style.height = "150px";
      elements.profilePreview.style.objectFit = "cover";
      elements.profilePreview.style.borderRadius = "50%";
      elements.profilePreview.style.border = "2px solid #ddd";
    }

    // Load bio
    const savedBio = storageHelpers.get(STORAGE_KEYS.BIO);
    if (savedBio && elements.bioTextarea) {
      elements.bioTextarea.value = savedBio;
      if (elements.bioCount) {
        elements.bioCount.textContent = savedBio.length;
      }
    }

    // Load gender
    const savedGender = storageHelpers.get(STORAGE_KEYS.GENDER);
    if (savedGender && elements.genderSelect) {
      elements.genderSelect.value = savedGender;
    }

    // Load notifications setting
    const savedNotifications = storageHelpers.get(STORAGE_KEYS.NOTIFICATIONS);
    if (savedNotifications && elements.notificationsSelect) {
      elements.notificationsSelect.value = savedNotifications;
    }

    // Load privacy setting
    const savedPrivacy = storageHelpers.get(STORAGE_KEYS.PRIVACY);
    if (savedPrivacy && elements.privacySelect) {
      elements.privacySelect.value = savedPrivacy;
    }

    // Load location
    const savedLocation = storageHelpers.get(STORAGE_KEYS.LOCATION);
    if (savedLocation && elements.gpsStatus) {
      elements.gpsStatus.textContent = savedLocation;
    }
  }

  function showError(message) {
    if (elements.errorDisplay) {
      elements.errorDisplay.textContent = message;
      elements.errorDisplay.hidden = false;
      setTimeout(() => (elements.errorDisplay.hidden = true), 5000);
    }
  }

  // Handle profile picture upload
  if (elements.profilePicInput && elements.profilePreview) {
    elements.profilePicInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.match("image/jpeg")) {
        showError("Only JPEG files are allowed.");
        elements.profilePicInput.value = "";
        return;
      }

      if (file.size > LIMITS.MAX_IMAGE_SIZE) {
        showError("Image must be less than 5MB.");
        elements.profilePicInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        elements.profilePreview.src = e.target.result;
        elements.profilePreview.style.display = "block";
        elements.profilePreview.style.width = "150px";
        elements.profilePreview.style.height = "150px";
        elements.profilePreview.style.objectFit = "cover";
        elements.profilePreview.style.borderRadius = "50%";
        elements.profilePreview.style.border = "2px solid #ddd";
        storageHelpers.save(STORAGE_KEYS.PROFILE_PIC, e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle bio character count
  if (elements.bioTextarea && elements.bioCount) {
    elements.bioTextarea.addEventListener("input", function () {
      const currentLength = this.value.length;
      elements.bioCount.textContent = currentLength;

      if (currentLength > LIMITS.MAX_BIO_LENGTH) {
        this.value = this.value.slice(0, LIMITS.MAX_BIO_LENGTH);
        elements.bioCount.textContent = LIMITS.MAX_BIO_LENGTH.toString();
      }
      storageHelpers.save(STORAGE_KEYS.BIO, this.value);
    });
  }

  // Gender selection
  if (elements.genderSelect) {
    elements.genderSelect.addEventListener("change", function () {
      storageHelpers.save(STORAGE_KEYS.GENDER, this.value);
    });
  }

  // Hobbies functionality
  let hobbies = storageHelpers.get(STORAGE_KEYS.HOBBIES, []);

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
  }

  function updateHobbiesDisplay() {
    if (!elements.hobbiesDisplay) return;
    elements.hobbiesDisplay.innerHTML = "";

    hobbies.forEach((hobby, index) => {
      const hobbySpan = document.createElement("span");
      hobbySpan.style.marginRight = "10px";
      hobbySpan.style.display = "inline-block";

      const hobbyText = document.createElement("span");
      hobbyText.textContent = hobby;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "×";
      deleteButton.style.marginLeft = "5px";
      deleteButton.style.color = "red";
      deleteButton.style.border = "none";
      deleteButton.style.background = "none";
      deleteButton.style.cursor = "pointer";

      deleteButton.onclick = () => {
        hobbies.splice(index, 1);
        updateHobbiesDisplay();
        storageHelpers.save(STORAGE_KEYS.HOBBIES, hobbies);
      };

      hobbySpan.appendChild(hobbyText);
      hobbySpan.appendChild(deleteButton);
      elements.hobbiesDisplay.appendChild(hobbySpan);
    });
  }

  if (elements.addHobbyButton && elements.hobbyInput) {
    elements.addHobbyButton.addEventListener("click", function () {
      const hobbyText = elements.hobbyInput.value.trim();

      if (!hobbyText) {
        showError("Please enter a hobby first");
        return;
      }

      if (hobbies.length >= LIMITS.MAX_HOBBIES) {
        showError("Maximum " + LIMITS.MAX_HOBBIES + " hobbies allowed");
        return;
      }

      const formattedHobby = capitalizeFirstLetter(hobbyText);

      if (hobbies.includes(formattedHobby)) {
        showError("This hobby is already added");
        return;
      }

      hobbies.push(formattedHobby);
      elements.hobbyInput.value = "";
      updateHobbiesDisplay();
      storageHelpers.save(STORAGE_KEYS.HOBBIES, hobbies);
    });

    elements.hobbyInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        elements.addHobbyButton.click();
      }
    });

    updateHobbiesDisplay();
  }

  // Event preferences handler
  const interestItems = document.querySelectorAll(".interest-item");
  if (interestItems.length > 0) {
    // Load saved preferences
    const savedPreferences = storageHelpers.get(STORAGE_KEYS.EVENT_PREFS, []);

    // Mark saved preferences as selected
    savedPreferences.forEach((category) => {
      const interestItem = document.querySelector(
        `.interest-item[data-interest="${category}"]`
      );
      if (interestItem) interestItem.classList.add("selected");
    });

    // Add click handlers to all interest items
    interestItems.forEach((item) => {
      item.addEventListener("click", function () {
        // Toggle selected class
        this.classList.toggle("selected");

        // Get all currently selected interests
        const selectedInterests = Array.from(
          document.querySelectorAll(".interest-item.selected")
        ).map((el) => el.getAttribute("data-interest"));

        // Save to storage
        storageHelpers.save(STORAGE_KEYS.EVENT_PREFS, selectedInterests);
        console.log("Updated interests:", selectedInterests);
      });
    });
  }

  // Notifications handler
  if (elements.notificationsSelect) {
    elements.notificationsSelect.addEventListener("change", function () {
      storageHelpers.save(STORAGE_KEYS.NOTIFICATIONS, this.value);
    });
  }

  // Privacy settings handler
  if (elements.privacySelect) {
    elements.privacySelect.addEventListener("change", function () {
      storageHelpers.save(STORAGE_KEYS.PRIVACY, this.value);
    });
  }

  // Location functionality
  if (elements.locationTypeSelect) {
    elements.locationTypeSelect.addEventListener("change", function () {
      const gpsLocation = document.getElementById("gpsLocation");
      const manualLocation = document.getElementById("manualLocation");

      if (this.value === "gps") {
        gpsLocation.hidden = false;
        manualLocation.hidden = true;
      } else {
        gpsLocation.hidden = true;
        manualLocation.hidden = false;

        // Manuel mod seçildiğinde, otomatik tamamlama özelliğini başlat
        setTimeout(() => {
          // Adres giriş alanına Places Autocomplete ekle
          if (elements.manualAddress) {
            const autocomplete = new google.maps.places.Autocomplete(
              elements.manualAddress,
              {
                types: ["address"],
              }
            );

            // Yer seçildiğinde tetiklenecek olay
            autocomplete.addListener("place_changed", function () {
              const place = autocomplete.getPlace();
              if (!place.geometry) return;

              // Seçilen konumu kaydet
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const locationText = `Location found: ${
                place.formatted_address
              } (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
              storageHelpers.save(STORAGE_KEYS.LOCATION, locationText);
            });
          }
        }, 300); // Kısa bir gecikme ekleyin, DOM'un güncellendiğinden emin olmak için
      }
    });
  }

  if (elements.getLocationButton) {
    elements.getLocationButton.addEventListener("click", async function () {
      console.log("Get location button clicked"); // Debug

      if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
      }

      elements.gpsStatus.textContent = "Getting location...";

      try {
        // Get user's current position (it Promise's :D)
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;

        // Google Maps Geocoder kullanarak konum bilgilerini al
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results[0]) {
            // Adres bileşenlerini çıkar
            const result = results[0];
            let state = "Unknown State";
            let city = "Unknown City";
            let neighborhood = "Unknown Neighborhood";

            // Adres bileşenlerini döngüyle kontrol et
            for (const component of result.address_components) {
              const types = component.types;

              if (types.includes("administrative_area_level_1")) {
                state = component.long_name;
              } else if (types.includes("locality")) {
                city = component.long_name;
              } else if (
                types.includes("neighborhood") ||
                types.includes("sublocality")
              ) {
                neighborhood = component.long_name;
              }
            }

            // UI'ı güncelle
            const locationText = `Location found: ${neighborhood}, ${city}, ${state} (${latitude.toFixed(
              3
            )}, ${longitude.toFixed(3)})`;
            storageHelpers.save(STORAGE_KEYS.LOCATION, locationText);
            elements.gpsStatus.textContent = locationText;
          } else {
            throw new Error("Geocoding failed: " + status);
          }
        });
      } catch (error) {
        console.error("Error getting location:", error);
        showError("Failed to retrieve location details. Please try again.");
        elements.gpsStatus.textContent = "";
      }
    });
  }

  /*        // Fetch location details using Reverse Geocoding API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();

        // Extract location details
        const address = data.address;
        const state = address.state || "Unknown State";
        const city =
          address.city || address.town || address.village || "Unknown City";
        const neighborhood =
          address.neighbourhood ||
          address.suburb ||
          address.hamlet ||
          "Unknown Neighborhood";

        // Update the UI with location details
        const locationText = `Location found: ${neighborhood}, ${city}, ${state} (${latitude.toFixed(
          3
        )}, ${longitude.toFixed(3)})`;
        storageHelpers.save(STORAGE_KEYS.LOCATION, locationText);
        elements.gpsStatus.textContent = locationText;
      } catch (error) {
        console.error("Error getting location:", error);
        showError("Failed to retrieve location details. Please try again.");
        elements.gpsStatus.textContent = "";
      }
    });
  }
  */

  // Review button
  if (elements.reviewButton) {
    elements.reviewButton.addEventListener("click", function () {
      window.location.href = "../html/profileSummary.html";
    });
  }

  // Load saved data when page load
  loadSavedData();

  // Step navigation (only for mobile step view)
  let currentStep = 1;
  const totalSteps = 4;

  function showStep(step) {
    document.querySelectorAll('.step').forEach(div => {
      div.classList.remove('active');
    });
    const target = document.querySelector(`.step[data-step="${step}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.step-dot').forEach(dot => {
      dot.classList.remove('active');
      if (parseInt(dot.dataset.step) === step) {
        dot.classList.add('active');
      }
    });
    
    const reviewMobileBtn = document.getElementById("reviewMobileBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (reviewMobileBtn && nextBtn) {
      if (step === 4) {
        reviewMobileBtn.style.display = "inline-block";
        nextBtn.style.display = "none";
      } else {
        reviewMobileBtn.style.display = "none";
        nextBtn.style.display = "inline-block";
      }
    }

    currentStep = step;
  }

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    if (currentStep < totalSteps) showStep(currentStep + 1);
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  const reviewMobileBtn = document.getElementById("reviewMobileBtn");
  if (reviewMobileBtn) {
    reviewMobileBtn.addEventListener("click", function () {
      window.location.href = "../html/profileSummary.html";
    });
  }

  showStep(1); // Start on first step
}
