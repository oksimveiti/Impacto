import {
  getUserDataWithAuthCheck as getUserData,
  updateProfileSettings,
  updatePreferenceSettings,
  uploadProfilePicture,
  updateUserPassword,
} from "../backend/settings-service.js";

// Initialize the settings page
export function initializeSettings() {
  // Get DOM elements
  settingsContent = document.getElementById("settingsContent");
  navItems = document.querySelectorAll(".nav-item");
  accountSubmenu = document.getElementById("accountSubmenu");
  supportSubmenu = document.getElementById("supportSubmenu");

  // Set up navigation
  setupNavigation();

  // Check for URL fragment and load corresponding section
  const hash = window.location.hash.substring(1); // Remove the # character
  if (hash) {
    // Find the nav item with matching data-section
    const navItem = document.querySelector(`[data-section="${hash}"]`);
    if (navItem) {
      // Remove active class from all items
      navItems.forEach((item) => item.classList.remove("active"));
      // Add active class to this item
      navItem.classList.add("active");
      // Load the appropriate section
      loadSettingsSection(hash);
    } else {
      // Default: load profile settings
      document
        .querySelector('[data-section="profile"]')
        .classList.add("active");
      loadProfileSettings();
    }
  } else {
    // No hash: load default section (Profile)
    document.querySelector('[data-section="profile"]').classList.add("active");
    loadProfileSettings();
  }

  // Load user data for header
  loadUserHeader();
}

// DOM Elements
let settingsContent;
let navItems;
let accountSubmenu;
let supportSubmenu;

// Initialize Google Maps Places Autocomplete for location
const locationInput = document.getElementById("locationInput");
if (
  locationInput &&
  window.google &&
  window.google.maps &&
  window.google.maps.places
) {
  const autocomplete = new google.maps.places.Autocomplete(locationInput, {
    types: ["address"],
  });

  // When a place is selected
  autocomplete.addListener("place_changed", function () {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    // Get the latitude and longitude
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Store the full address and coordinates for later use when saving
    locationInput.dataset.fullAddress = place.formatted_address;
    locationInput.dataset.lat = lat;
    locationInput.dataset.lng = lng;

    console.log("Selected location:", {
      address: place.formatted_address,
      lat: lat,
      lng: lng,
    });
  });
}

function setupProfileEventListeners() {
  // Bio character count
  const bioInput = document.getElementById("bioInput");
  const bioCount = document.getElementById("bioCount");

  if (bioInput && bioCount) {
    bioInput.addEventListener("input", function () {
      const currentLength = this.value.length;
      bioCount.textContent = currentLength;

      if (currentLength > 500) {
        this.value = this.value.slice(0, 500);
        bioCount.textContent = "500";
      }
    });
  }

  // Profile picture change
  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const profilePicInput = document.getElementById("profilePicInput");
  const profilePicPreview = document.getElementById("profilePicPreview");

  if (changePhotoBtn && profilePicInput) {
    changePhotoBtn.addEventListener("click", function () {
      profilePicInput.click();
    });

    profilePicInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.match("image/jpeg")) {
        alert("Only JPEG files are allowed.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        alert("Image must be less than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        profilePicPreview.src = e.target.result;
        profilePicPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  // Save profile changes
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async function () {
      try {
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = "Saving...";

        // Get values from form
        const displayName = document.getElementById("nameInput").value.trim();
        const email = document.getElementById("emailInput").value.trim();
        const bio = document.getElementById("bioInput").value.trim();
        const gender = document.getElementById("genderSelect").value;
        const locationInput = document.getElementById("locationInput");
        const location = locationInput.value.trim();

        // Validate inputs
        if (!displayName) {
          alert("Please enter your name.");
          saveProfileBtn.disabled = false;
          saveProfileBtn.textContent = "Save Changes";
          return;
        }

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          alert("Please enter a valid email address.");
          saveProfileBtn.disabled = false;
          saveProfileBtn.textContent = "Save Changes";
          return;
        }

        // Get location data from dataset if available
        let coordinates = { latitude: 0, longitude: 0 };
        if (locationInput.dataset.lat && locationInput.dataset.lng) {
          coordinates = {
            latitude: parseFloat(locationInput.dataset.lat),
            longitude: parseFloat(locationInput.dataset.lng)
          };
        }

        // Prepare update data
        const profileData = {
          basicInfo: {
            displayName: displayName,
            email: email,
            bio: bio,
            gender: gender,
            lastUpdated: new Date(),
          },
          location: {
            address: location,
            coordinates: coordinates,
            type: "manual"
          },
        };

        // Check if profile picture was changed
        const profilePicPreview = document.getElementById("profilePicPreview");
        if (
          profilePicPreview &&
          profilePicPreview.src &&
          profilePicPreview.src.startsWith("data:image")
        ) {
          // Upload new profile picture
          await uploadProfilePicture(profilePicPreview.src);
        }

        // Update profile data
        await updateProfileSettings(profileData);

        // Show success message
        showSuccessMessage("Profile has been updated");

        // Update header
        loadUserHeader();
      } catch (error) {
        console.error("Error saving profile settings:", error);
        alert("Failed to save profile settings. Please try again.");
      } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = "Save Changes";
      }
    });
  }

  // Initialize Google Maps Places Autocomplete for location
  const locationInput = document.getElementById("locationInput");
  if (locationInput && window.google && window.google.maps && window.google.maps.places) {
    const autocomplete = new google.maps.places.Autocomplete(locationInput, {
      types: ["address"]
    });

    // When a place is selected
    autocomplete.addListener("place_changed", function () {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      // Get the latitude and longitude
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Store the full address and coordinates for later use when saving
      locationInput.dataset.fullAddress = place.formatted_address;
      locationInput.dataset.lat = lat;
      locationInput.dataset.lng = lng;

      console.log("Selected location:", {
        address: place.formatted_address,
        lat: lat,
        lng: lng
      });
    });
  }
}

// Set up navigation between settings sections
function setupNavigation() {
  // Toggle submenu visibility
  document
    .querySelector('[data-section="account"]')
    .addEventListener("click", function () {
      accountSubmenu.classList.toggle("expanded");
    });

  document
    .querySelector('[data-section="support"]')
    .addEventListener("click", function () {
      supportSubmenu.classList.toggle("expanded");
    });

  // Set up navigation between settings sections
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const section = this.getAttribute("data-section");

      // Skip if clicking on dropdown parent items
      if (section === "account" || section === "support") return;

      // Remove active class from all items
      navItems.forEach((navItem) => navItem.classList.remove("active"));

      // Add active class to clicked item
      this.classList.add("active");

      // Update the URL hash
      window.location.hash = section;

      // Load the appropriate settings section
      loadSettingsSection(section);
    });
  });
  // --- MOBILE VIEW: Show content, hide sidebar ---
  const navLinks = document.querySelectorAll(".nav-link");
  const sidebar = document.querySelector(".sidebar");
  const content = document.querySelector(".content");
  const backBtn = document.querySelector(".mobile-back-btn");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.style.display = "none";
        content.style.display = "block";
        backBtn.style.display = "block";
      }
    });
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      sidebar.style.display = "flex";
      content.style.display = "none";
      backBtn.style.display = "none";
    });
  }
  const mobileBackBtn = document.querySelector(".back-button");
  if (mobileBackBtn) {
    mobileBackBtn.addEventListener("click", () => {
      sidebar.style.display = "flex";
      content.style.display = "none";
      backBtn.style.display = "none";
    });
  }
  // Restore default layout on window resize (desktop view)
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.style.display = "block";
      content.style.display = "block";
      backBtn.style.display = "none";
    }
  });
}

// Function to load the appropriate settings section
async function loadSettingsSection(section) {
  // Show loading state
  settingsContent.innerHTML = "<h2>Loading...</h2>";

  try {
    switch (section) {
      case "profile":
        await loadProfileSettings();
        break;
      case "preference":
        await loadPreferenceSettings();
        break;
      case "password":
        loadPasswordSettings();
        break;
      case "faqs":
      case "contact":
      case "privacy":
      case "terms":
        loadSupportSection(section);
        break;
      default:
        settingsContent.innerHTML =
          "<h2>Select a settings option from the menu</h2>";
    }
  } catch (error) {
    console.error("Error loading settings section:", error);
    settingsContent.innerHTML =
      "<h2>Error loading settings. Please try again.</h2>";
  }
}

// Load user data for header
async function loadUserHeader() {
  try {
    const userData = await getUserData();

    if (userData) {
      console.log("loadUserHeader - userData:", userData);

      // Başlıktaki profil resmi ve kullanıcı adını güncelle

      const headerProfilePics = document.querySelectorAll(".headerProfilePic");
      const headerUsernames = document.querySelectorAll(".headerUsername");

      if (headerProfilePics.length > 0) {
        headerProfilePics.forEach((img) => {
          if (userData.basicInfo && userData.basicInfo.profilePictureUrl) {
            img.src = userData.basicInfo.profilePictureUrl;
            img.style.display = "block";
          } else {
            // Profil resmi yoksa varsayılan resim kullan
            img.src = "../assets/default-profile.png";
            img.style.display = "block";
          }
        });
      }

      if (headerUsernames.length > 0) {
        const displayName =
          userData.auth?.displayName ||
          userData.basicInfo?.displayName ||
          (userData.auth?.email ? userData.auth.email.split("@")[0] : null) ||
          "User";

        headerUsernames.forEach((el) => {
          el.textContent = displayName;
        });
      }
    }
  } catch (error) {
    console.error("Error loading user header:", error);
  }
}

// Function to show success message
function showSuccessMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.className = "success-message";
  messageElement.textContent = message;
  messageElement.style.position = "fixed";
  messageElement.style.top = "20px";
  messageElement.style.left = "50%";
  messageElement.style.transform = "translateX(-50%)";
  messageElement.style.backgroundColor = "#4CAF50";
  messageElement.style.color = "white";
  messageElement.style.padding = "15px 20px";
  messageElement.style.borderRadius = "4px";
  messageElement.style.zIndex = "1000";

  document.body.appendChild(messageElement);

  setTimeout(() => {
    messageElement.style.opacity = "0";
    messageElement.style.transition = "opacity 0.5s";
    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 500);
  }, 3000);
}

// Update this part in your loadProfileSettings function in settings-ui.js
async function loadProfileSettings() {
  try {
    // Kullanıcı verilerini al
    const userData = await getUserData();
    console.log("loadProfileSettings - userData:", userData);

    if (!userData) {
      settingsContent.innerHTML =
        "<h2>Error</h2><p>Could not load user profile data.</p>";
      return;
    }

    // Gerekli verileri çıkar
    const profilePicUrl = userData.basicInfo?.profilePictureUrl || "";
    const displayName =
      userData.username ||
      userData.auth?.displayName ||
      userData.basicInfo?.displayName ||
      "";
    const email = userData.auth?.email || userData.basicInfo?.email || "";
    const bio = userData.basicInfo?.bio || "";
    const gender = userData.basicInfo?.gender || "";
    const location = userData.location?.address || "";

    console.log("Profile data being displayed:", {
      profilePicUrl,
      displayName,
      email,
      bio,
      gender,
      location,
    });

    // Profil ayarları için HTML oluştur
    const html = `
        <h2>Profile Setting</h2>
        
        <div class="profile-photo-container" style="text-align: center; margin-bottom: 30px;">
          <img 
            id="profilePicPreview" 
            src="${profilePicUrl}" 
            alt="Profile" 
            style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; ${!profilePicUrl ? "display:none;" : "display:block;"
      }"
          >
          <div style="margin-top: 10px;">
            <input type="file" id="profilePicInput" accept="image/jpeg,image/png" style="display: none;">
            <button id="changePhotoBtn" class="btn" style="background-color: #eee; color: #333;">Change Photo</button>
          </div>
        </div>
        
        <div class="field-group">
          <label for="nameInput">User Name</label>
          <input 
            type="text" 
            id="nameInput" 
            class="form-control" 
            value="${displayName}" 
            placeholder="Enter your name"
          >
        </div>
        
        <div class="field-group">
          <label for="emailInput">Email</label>
          <input 
            type="email" 
            id="emailInput" 
            class="form-control" 
            value="${email}" 
            placeholder="Enter your email"
          >
        </div>
        
        <div class="field-group">
          <label for="bioInput">Bio</label>
          <textarea 
            id="bioInput" 
            class="form-control" 
            rows="4" 
            placeholder="Tell us about yourself"
            maxlength="500"
          >${bio}</textarea>
          <p class="hint-text"><span id="bioCount">${bio.length
      }</span>/500 characters</p>
        </div>
        
        <div class="field-group">
          <label for="genderSelect">Gender (optional)</label>
          <select id="genderSelect" class="form-control">
            <option value="" ${gender === "" ? "selected" : ""
      }>Prefer not to say</option>
            <option value="female" ${gender === "female" ? "selected" : ""
      }>Female</option>
            <option value="male" ${gender === "male" ? "selected" : ""
      }>Male</option>
            <option value="non-binary" ${gender === "non-binary" ? "selected" : ""
      }>Non-binary</option>
            <option value="other" ${gender === "other" ? "selected" : ""
      }>Other</option>
          </select>
        </div>
        
        <div class="field-group">
          <label for="locationInput">Location</label>
          <input 
            type="text" 
            id="locationInput" 
            class="form-control" 
            value="${location}" 
            placeholder="Enter your location"
          >
        </div>
        
        <div style="text-align: right; margin-top: 30px;">
          <button id="saveProfileBtn" class="btn">Save Changes</button>
        </div>
      `;

    // HTML'i ayarla
    settingsContent.innerHTML = html;

    // Event listener'ları ekle
    setupProfileEventListeners();
  } catch (error) {
    console.error("Error loading profile settings:", error);
    settingsContent.innerHTML =
      "<h2>Error</h2><p>Failed to load profile settings. Please try again.</p>";
  }
}

async function loadPreferenceSettings() {
  try {
    // Get user data
    const userData = await getUserData();

    if (!userData) {
      settingsContent.innerHTML =
        "<h2>Error</h2><p>Could not load user preference data.</p>";
      return;
    }

    // Get current event preferences and hobbies
    const eventPreferences = userData.interests?.eventPreferences || [];
    const hobbies = userData.interests?.hobbies || [];

    // Create the HTML for preference settings
    const html = `
    <div class="settings-header">
      <h2>Account Setting</h2>
      
      <div class="settings-tabs">
        <div class="tab active" data-tab="preference">Preference Setting</div>
        <div class="tab" data-tab="password">Change Password</div>
      </div>
    </div>
    
    <div class="settings-content">
      <!-- Hobbies Section -->
      <div class="hobbies-section">
        <h3>Your Hobbies</h3>
        <p>Add hobbies you enjoy</p>
        
        <div class="field-group">
          <div id="hobbiesDisplay"></div>
          <div id="hobbiesContainer">
            <div class="hobby-input">
              <input
                type="text"
                id="hobby-input"
                class="hobby"
                placeholder="Enter a hobby"
              />
              <button type="button" id="add-hobby-btn" class="add-hobby">+</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Interests Section -->
      <h3>Your Interests</h3>
      <p>Select categories you're interested in</p>
      
      <div class="interests-grid">
        <!-- Social Activism -->
        <div class="interest-item ${eventPreferences.includes("Social Activism") ? "selected" : ""
      }" data-interest="Social Activism">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/social.png" alt="Social Activism">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/social_hover.png" alt="Social Activism hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/social_selected.png" alt="Social Activism selected">
          </div>
          <div class="interest-label">Social Activism</div>
        </div>
        
        <!-- Environment -->
        <div class="interest-item ${eventPreferences.includes("Environment") ? "selected" : ""
      }" data-interest="Environment">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/environment.png" alt="Environment">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/environment_hover.png" alt="Environment hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/environment_selected.png" alt="Environment selected">
          </div>
          <div class="interest-label">Environment</div>
        </div>
        
        <!-- Politics -->
        <div class="interest-item ${eventPreferences.includes("Politics") ? "selected" : ""
      }" data-interest="Politics">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/politics.png" alt="Politics">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/politics_hover.png" alt="Politics hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/politics_selected.png" alt="Politics selected">
          </div>
          <div class="interest-label">Politics</div>
        </div>
        
        <!-- Education -->
        <div class="interest-item ${eventPreferences.includes("Education") ? "selected" : ""
      }" data-interest="Education">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/education.png" alt="Education">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/education_hover.png" alt="Education hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/education_selected.png" alt="Education selected">
          </div>
          <div class="interest-label">Education</div>
        </div>
        
        <!-- Community -->
        <div class="interest-item ${eventPreferences.includes("Community") ? "selected" : ""
      }" data-interest="Community">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/community.png" alt="Community">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/community_hover.png" alt="Community hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/community_selected.png" alt="Community selected">
          </div>
          <div class="interest-label">Community</div>
        </div>
        
        <!-- Human Rights -->
        <div class="interest-item ${eventPreferences.includes("Human Rights") ? "selected" : ""
      }" data-interest="Human Rights">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/human.png" alt="Human Rights">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/human_hover.png" alt="Human Rights hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/human_selected.png" alt="Human Rights selected">
          </div>
          <div class="interest-label">Human Rights</div>
        </div>
        
        <!-- Health -->
        <div class="interest-item ${eventPreferences.includes("Health") ? "selected" : ""
      }" data-interest="Health">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/health.png" alt="Health">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/health_hover.png" alt="Health hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/health_selected.png" alt="Health selected">
          </div>
          <div class="interest-label">Health</div>
        </div>
        
        <!-- Culture -->
        <div class="interest-item ${eventPreferences.includes("Culture") ? "selected" : ""
      }" data-interest="Culture">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/culture.png" alt="Culture">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/culture_hover.png" alt="Culture hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/culture_selected.png" alt="Culture selected">
          </div>
          <div class="interest-label">Culture</div>
        </div>
        
        <!-- Animal Rights -->
        <div class="interest-item ${eventPreferences.includes("Animal Rights") ? "selected" : ""
      }" data-interest="Animal Rights">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/animal.png" alt="Animal Rights">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/animal_hover.png" alt="Animal Rights hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/animal_selected.png" alt="Animal Rights selected">
          </div>
          <div class="interest-label">Animal Rights</div>
        </div>
        
        <!-- Social Justice -->
        <div class="interest-item ${eventPreferences.includes("Social Justice") ? "selected" : ""
      }" data-interest="Social Justice">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/justice.png" alt="Social Justice">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/justice_hover.png" alt="Social Justice hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/justice_selected.png" alt="Social Justice selected">
          </div>
          <div class="interest-label">Social Justice</div>
        </div>
        
        <!-- Others -->
        <div class="interest-item ${eventPreferences.includes("Others") ? "selected" : ""
      }" data-interest="Others">
          <div class="interest-icon">
            <!-- Default icon (normal state) -->
            <img class="icon-default" src="../../profile-setup-Semih/icons/60*60/others.png" alt="Others">
            
            <!-- Hover icon (appears on hover when not selected) -->
            <img class="icon-hover" src="../../profile-setup-Semih/icons/60*60/others_hover.png" alt="Others hover">
            
            <!-- Selected icon (appears when selected) -->
            <img class="icon-selected" src="../../profile-setup-Semih/icons/60*60/others_selected.png" alt="Others selected">
          </div>
          <div class="interest-label">Others</div>
        </div>
      </div>
      
      <div style="text-align: right; margin-top: 30px;">
        <button id="savePreferencesBtn" class="btn">Save Changes</button>
      </div>
    </div>
  `;

    // Set the HTML
    settingsContent.innerHTML = html;

    // Add custom styles
    const style = document.createElement("style");
    style.textContent = `
        .settings-tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }
        
        .tab {
          padding: 10px 15px;
          cursor: pointer;
          margin-right: 10px;
        }
        
        .tab.active {
          border-bottom: 2px solid #3949ab;
          color: #3949ab;
          font-weight: bold;
        }
        
        .hobbies-section {
          margin-bottom: 30px;
        }
        
        .hobby-input {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .hobby-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .add-hobby {
          background-color: #3949ab;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
        }
        
        #hobbiesDisplay {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .hobby-tag {
          background-color: #f0f0f0;
          padding: 5px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .delete-hobby {
          color: #ff5252;
          cursor: pointer;
          border: none;
          background: none;
          font-weight: bold;
        }
        
        .interests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        
        .interest-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          border-radius: 8px;
          padding: 10px;
          transition: all 0.2s;
        }
        
        .interest-item:hover {
          background-color: rgba(57, 73, 171, 0.05);
        }
        
        .interest-item.selected {
          background-color: rgba(57, 73, 171, 0.1);
          border: 2px solid #3949ab;
        }
        
        .interest-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background-color: #f0f0f0;
          margin-bottom: 10px;
        }
        
        .interest-item.selected .interest-icon {
          background-color: #3949ab;
          color: white;
        }
        
        .interest-label {
          font-size: 12px;
          font-weight: 500;
        }
      `;
    document.head.appendChild(style);

    // Add event listeners
    setupPreferenceEventListeners();

    // Display existing hobbies
    displayHobbies(hobbies);
  } catch (error) {
    console.error("Error loading preference settings:", error);
    settingsContent.innerHTML =
      "<h2>Error</h2><p>Failed to load preference settings. Please try again.</p>";
  }
}

// Function to display hobbies
function displayHobbies(hobbies) {
  const hobbiesDisplay = document.getElementById("hobbiesDisplay");
  if (!hobbiesDisplay) return;

  hobbiesDisplay.innerHTML = "";

  hobbies.forEach((hobby, index) => {
    const hobbyTag = document.createElement("div");
    hobbyTag.className = "hobby-tag";

    const hobbyText = document.createElement("span");
    hobbyText.textContent = hobby;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.className = "delete-hobby";
    deleteButton.setAttribute("data-index", index);

    hobbyTag.appendChild(hobbyText);
    hobbyTag.appendChild(deleteButton);
    hobbiesDisplay.appendChild(hobbyTag);
  });
}

// Update the setupPreferenceEventListeners function
function setupPreferenceEventListeners() {
  // Tab navigation
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const section = this.getAttribute("data-tab");

      // Skip if already active
      if (this.classList.contains("active")) return;

      // Switch tabs
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      // Load the corresponding section
      loadSettingsSection(section);
    });
  });

  // Hobbies management
  const addHobbyBtn = document.getElementById("add-hobby-btn");
  const hobbyInput = document.getElementById("hobby-input");

  if (addHobbyBtn && hobbyInput) {
    // Add hobby button
    addHobbyBtn.addEventListener("click", async function () {
      addHobby();
    });

    // Enter key to add hobby
    hobbyInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addHobby();
      }
    });

    // Delete hobby buttons
    document.addEventListener("click", function (e) {
      if (e.target && e.target.className === "delete-hobby") {
        const index = parseInt(e.target.getAttribute("data-index"));
        deleteHobby(index);
      }
    });
  }

  // Interest selection
  const interestItems = document.querySelectorAll(".interest-item");

  interestItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Toggle selected class
      this.classList.toggle("selected");

      // Handle icon state changes
      const icon = this.querySelector("svg");
      if (this.classList.contains("selected")) {
        icon.classList.add("selected-state");
        icon.classList.remove("hover-state");
      } else {
        icon.classList.remove("selected-state");
        icon.classList.remove("hover-state");
      }
    });

    // Add hover effect
    item.addEventListener("mouseenter", function () {
      if (!this.classList.contains("selected")) {
        const icon = this.querySelector("svg");
        icon.classList.add("hover-state");
      }
    });

    item.addEventListener("mouseleave", function () {
      if (!this.classList.contains("selected")) {
        const icon = this.querySelector("svg");
        icon.classList.remove("hover-state");
      }
    });
  });

  // Save button
  const saveBtn = document.getElementById("savePreferencesBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        // Get selected interests
        const selectedInterests = [];
        document.querySelectorAll(".interest-item.selected").forEach((item) => {
          selectedInterests.push(item.getAttribute("data-interest"));
        });

        // Get hobbies
        const hobbies = [];
        document.querySelectorAll(".hobby-tag span").forEach((tag) => {
          hobbies.push(tag.textContent);
        });

        // Update preferences
        await updatePreferenceSettings(selectedInterests, hobbies);

        // Show success message
        showSuccessMessage("Preference setting has been updated");
      } catch (error) {
        console.error("Error saving preferences:", error);
        alert("Failed to save preferences. Please try again.");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Changes";
      }
    });
  }
}

// Helper function to add a hobby
async function addHobby() {
  const hobbyInput = document.getElementById("hobby-input");
  const hobbyText = hobbyInput.value.trim();

  if (!hobbyText) {
    alert("Please enter a hobby");
    return;
  }

  // Get current hobbies
  const hobbies = [];
  document.querySelectorAll(".hobby-tag span").forEach((tag) => {
    hobbies.push(tag.textContent);
  });

  if (hobbies.length >= 10) {
    alert("Maximum 10 hobbies allowed");
    return;
  }

  const formattedHobby = capitalizeFirstLetter(hobbyText);

  if (hobbies.includes(formattedHobby)) {
    alert("This hobby is already added");
    return;
  }

  // Add new hobby to the array
  hobbies.push(formattedHobby);

  // Clear input
  hobbyInput.value = "";

  // Update display
  displayHobbies(hobbies);
}

// Helper function to delete a hobby
function deleteHobby(index) {
  // Get current hobbies
  const hobbies = [];
  document.querySelectorAll(".hobby-tag span").forEach((tag) => {
    hobbies.push(tag.textContent);
  });

  // Remove the hobby at the specified index
  hobbies.splice(index, 1);

  // Update display
  displayHobbies(hobbies);
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

function loadPasswordSettings() {
  // HTML formunu oluştur
  const html = `
      <div class="settings-header">
        <h2>Account Setting</h2>
        
        <div class="settings-tabs">
          <div class="tab" data-tab="preference">Preference Setting</div>
          <div class="tab active" data-tab="password">Change Password</div>
        </div>
      </div>
      
      <div class="settings-content">
        <div class="password-form">
          <h3>Change Your Password</h3>
          <p>Please enter your current password and a new password to update.</p>
          
          <div class="field-group">
            <label for="currentPassword">Current Password</label>
            <input type="password" id="currentPassword" class="form-control">
          </div>
          
          <div class="field-group">
            <label for="newPassword">New Password</label>
            <input type="password" id="newPassword" class="form-control">
            <p class="hint-text">
                Password must be: <br>
                - At least 8 characters long.<br>
                - One uppercase letter (A-Z)<br>
                - One lowercase letter (a-z)<br>
                - One number (0-9)<br>
                - One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
            </p>
          </div>
          
          <div class="field-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" class="form-control">
          </div>
          
          <div style="text-align: right; margin-top: 30px;">
            <button id="changePasswordBtn" class="btn">Change Password</button>
          </div>
        </div>
      </div>
    `;

  settingsContent.innerHTML = html;

  // Şifre değiştirme butonu için olay dinleyicisi ekle
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async function () {
      try {
        changePasswordBtn.disabled = true;
        changePasswordBtn.textContent = "Changing...";

        // Form değerlerini al
        const currentPassword =
          document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword =
          document.getElementById("confirmPassword").value;

        // Girdileri doğrula
        if (!currentPassword) {
          alert("Please enter your current password.");
          return;
        }

        if (!newPassword) {
          alert("Please enter a new password.");
          return;
        }

        if (newPassword.length < 8) {
          alert("Password must be at least 8 characters long.");
          return;
        }

        const requirements = {
          uppercase: /[A-Z]/.test(newPassword),
          lowercase: /[a-z]/.test(newPassword),
          number: /[0-9]/.test(newPassword),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        };

        if (!Object.values(requirements).every(Boolean)) {
          alert("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
          return false;
        }

        // Şifreyi güncelle - updateUserPassword FONKSİYONUNU BURADA ÇAĞIRIYORUZ
        await updateUserPassword(currentPassword, newPassword);

        // Başarı mesajı göster
        showSuccessMessage("Password has been updated successfully");

        // Formu temizle
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
      } catch (error) {
        console.error("Error changing password:", error);
        if (error.code === "auth/wrong-password") {
          alert("Current password is incorrect. Please try again.");
        } else if (error.code === "auth/weak-password") {
          alert("New password is too weak. Please choose a stronger password.");
        } else {
          alert("Failed to change password. Please try again.");
        }
      } finally {
        changePasswordBtn.disabled = false;
        changePasswordBtn.textContent = "Change Password";
      }
    });
  }
}

const faqsText = `
<h3>1. Account Registration and Login FAQs</h3>
<p>Q: What is required for account registration?</p>
<p>A: Email address, password, and display name are required.</p>
<p>Q: Can I create multiple accounts?</p>
<p>A: In principle, one account per person is allowed.</p>

<h3>2. Event Search and Participation FAQs</h3>
<p>Q: How do I search for events?</p>
<p>A: You can search by keywords and location, or you can find events near your current location.</p>
<p>Q: How do I participate in an event?</p>
<p>A: Apply for participation from the event details page.</p>
<p>Q: Can I cancel my participation application?</p>
<p>A: Please cancel your participation from the event details page.</p>
<p>Q: What happens if an event is canceled?</p>
<p>A: You will receive a notification from the event organizer. Please check the event details page for more information.</p>

<h3>3. Event Organizer FAQs</h3>
<p>Q: How do I post an event?</p>
<p>A: Create an organizer account and enter the information from the event and signature registration page.</p>
<p>Q: Is there a fee for posting an event?</p>
<p>A: It depends on the plan. Please check the pricing plans.</p>
<p>Q: How do I contact participants?</p>
<p>A: Please use the comment function on the event details page.</p>
<p>Q: Can I check the number of event participants?</p>
<p>A: You can check it on the event details page.</p>

<h3>4. App Functionality FAQs</h3>
<p>Q: How do I change the notification settings?</p>
<p>A: Please change them in your browser or device settings.</p>
<p>Q: The map is not displayed.</p>
<p>A: Please check if the location information service is enabled.</p>
<p>Q: The app is not working properly.</p>
<p>A: Please restart the app or update to the latest version.</p>

<h3>5. Other FAQs</h3>
<p>Q: Please tell me about the handling of personal information.</p>
<p>A: Please check the privacy policy.</p>
<p>Q: Where can I check the terms of service?</p>
<p>A: Please check the terms of service from the settings screen.</p>
<p>Q: Where is the contact information for the app?</p>
<p>A: Please contact us by email.</p>
`;


const contactText = `
<p>We value your feedback and are here to assist you with any questions or concerns. Please feel free to reach out to us using the following contact information:</p>
<p>Email: ******@mylangara.ca</p>
<p>Address: 100 West 49th Avenue, Vancouver B.C.Canada V5Y 2Z6</p>
<p>Phone: +1 (555) 123-4567</p>
<p>Our support team is available to help you with:</p>

<p>Technical issues</p>
<p>Account inquiries</p>
<p>Feedback and suggestions</p>
<p>General questions</p>
<p>We aim to respond to all inquiries within 24-48 hours.</p>
`;

const privacyText = `
<p>At Impacto, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information.</p>
<h3>Information Collection:</h3>
<p>We collect information such as your full name, preferred language, and optional social media links.</p>
<p>We may also collect optional location data to provide tailored event information.</p>
<p>Information is collected during account registration and app usage.</p>
<h3>Use of Information:</h3>
<p>Personal information is used to provide and improve our services, including event organization and map functionalities.</p>
<p>We use your information to communicate with you and to ensure community accountability.</p>
<p>We do not share your personal information with third parties without your consent, except as required by law.</p>
<h3>Data Security:</h3>
<p>We implement security measures to protect your data from unauthorized access, use, or disclosure.</p>
<p>We retain your personal information only for as long as necessary to provide our services.</p>
<h3>User Rights:</h3>
<p>You have the right to access, correct, or delete your personal information.</p>
<p>You can manage your privacy settings within the app.</p>
<h3>Age Verification:</h3>
<p>Users must confirm they are at least 13 years old, or the minimum age required by applicable local laws.</p>
`;

const termsText = `
<p>By using the Impacto app, you agree to comply with the following terms and conditions:</p>
<h3>1. Acceptance of Terms:</h3>
<p>You must read and agree to these terms before using the app.</p>
<p>By using the app, you acknowledge your commitment to abide by these terms.</p>
<h3>2. User Responsibilities:</h3>
<p>You are responsible for maintaining the confidentiality of your account information.</p>
<p>You agree to use the app in compliance with all applicable laws and regulations.</p>
<h3>3. Age Requirement:</h3>
<p>You must be at least 13 years old, or the minimum age required by applicable local laws.</p>
<h3>4. Profile Information:</h3>
<p>Users are required to provide their full name as part of their profile information.</p>
<p>Users should also specify their preferred language for app communication.</p>
<h3>5. Social Media Integration (Optional):</h3>
<p>Users may choose to link their social media accounts to facilitate a smoother sign-in process and enhance sharing capabilities.</p>
<h3>6. Location Access (Optional):</h3>
<p>Users may grant permission for location access, enabling the app to provide tailored information about events and actions happening in their vicinity.</p>
<h3>7. Intellectual Property:</h3>
<p>All content within the app is the property of Impacto and is protected by copyright laws.</p>
<h3>8. Limitation of Liability:</h3>
<p>Impacto is not liable for any damages arising from your use of the app.</p>
<h3>9. Changes to Terms:</h3>
<p>We reserve the right to modify these terms at any time. Changes will be posted within the app.</p>
`;

function loadSupportSection(section) {
  let title = "";
  let contentText = "";

  switch (section) {
    case "faqs":
      title = "FAQs";
      contentText = faqsText;
      break;
    case "contact":
      title = "Contact Impacto";
      contentText = contactText;
      break;
    case "privacy":
      title = "Privacy Policy";
      contentText = privacyText;
      break;
    case "terms":
      title = "Terms of Use";
      contentText = termsText;
      break;
    default:
      title = "Support";
  }

  const html = `
      <div class="settings-header">
        <h2>Contact Support</h2>
        
        <div class="settings-tabs">
          <div class="tab ${section === "faqs" ? "active" : ""}" data-section="faqs">FAQs</div>
          <div class="tab ${section === "contact" ? "active" : ""}" data-section="contact">Contact Impacto</div>
          <div class="tab ${section === "privacy" ? "active" : ""}" data-section="privacy">Privacy Policy</div>
          <div class="tab ${section === "terms" ? "active" : ""}" data-section="terms">Terms of Use</div>
        </div>
      </div>      
      <div class="settings-content">
        <h3>${title}</h3>
        <p>${contentText}</p>
      </div>
      
    `;

  settingsContent.innerHTML = html;

  // Add event listeners for tab navigation
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const section = this.getAttribute("data-section");

      // Skip if already active
      if (this.classList.contains("active")) return;

      // Load the corresponding section
      loadSettingsSection(section);
    });
  });
}
// 1. Account Registration and Login FAQs

// Q: What is required for account registration?
// A: Email address, password, and display name are required.
// Q: Can I create multiple accounts?
// A: In principle, one account per person is allowed.
// 2. Event Search and Participation FAQs

// Q: How do I search for events?
// A: You can search by keywords and location, or you can find events near your current location.
// Q: How do I participate in an event?
// A: Apply for participation from the event details page.
// Q: Can I cancel my participation application?
// A: Please cancel your participation from the event details page.
// Q: What happens if an event is canceled?
// A: You will receive a notification from the event organizer. Please check the event details page for more information.
// 3. Event Organizer FAQs

// Q: How do I post an event?
// A: Create an organizer account and enter the information from the event and signature registration page.
// Q: Is there a fee for posting an event?
// A: It depends on the plan. Please check the pricing plans.
// Q: How do I contact participants?
// A: Please use the comment function on the event details page.
// Q: Can I check the number of event participants?
// A: You can check it on the event details page.
// 4. App Functionality FAQs

// Q: How do I change the notification settings?
// A: Please change them in your browser or device settings.
// Q: The map is not displayed.
// A: Please check if the location information service is enabled.
// Q: The app is not working properly.
// A: Please restart the app or update to the latest version.
// 5. Other FAQs

// Q: Please tell me about the handling of personal information.
// A: Please check the privacy policy.
// Q: Where can I check the terms of service?
// A: Please check the terms of service from the settings screen.
// Q: Where is the contact information for the app?
// A: Please contact us by email.
// `;

// const contactText = `
// <p>Contact Impacto</p>

// <p>We value your feedback and are here to assist you with any questions or concerns. Please feel free to reach out to us using the following contact information:</p>

// <p>Email: [メールアドレスを削除しました]</p>
// <p>Address: 123 Main Street, Anytown, CA 91234, USA</p>
// <p>Phone: +1 (555) 123-4567</p>
// <p>Our support team is available to help you with:</p>

// <p>Technical issues</p>
// <p>Account inquiries</p>
// <p>Feedback and suggestions</p>
// <p>General questions</p>
// <p>We aim to respond to all inquiries within 24-48 hours.</p>
// `;

// const privacyText = `
// <p>Privacy Policy</p>

// <p>At Impacto, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information.</p>

// <p>Information Collection:</p>

// <p>We collect information such as your full name, preferred language, and optional social media links.</p>
// <p>We may also collect optional location data to provide tailored event information.</p>
// <p>Information is collected during account registration and app usage.</p>
// <p>Use of Information:</p>

// <p>Personal information is used to provide and improve our services, including event organization and map functionalities.</p>
// <p>We use your information to communicate with you and to ensure community accountability.</p>
// <p>We do not share your personal information with third parties without your consent, except as required by law.</p>
// <p>Data Security:</p>

// <p>We implement security measures to protect your data from unauthorized access, use, or disclosure.</p>
// <p>We retain your personal information only for as long as necessary to provide our services.</p>
// <p>User Rights:</p>

// <p>You have the right to access, correct, or delete your personal information.</p>
// <p>You can manage your privacy settings within the app.</p>
// <p>Age Verification:</p>

// <p>Users must confirm they are at least 13 years old, or the minimum age required by applicable local laws.</p>
// `;

// const termsText = `
// <p>Terms of Use</p>

// <p>By using the Impacto app, you agree to comply with the following terms and conditions:</p>

// <p>1. Acceptance of Terms:</p>

// <p>You must read and agree to these terms before using the app.</p>
// <p>By using the app, you acknowledge your commitment to abide by these terms.</p>

// <p>2. User Responsibilities:</p>

// <p>You are responsible for maintaining the confidentiality of your account information.</p>
// <p>You agree to use the app in compliance with all applicable laws and regulations.</p>

// <p>3. Age Requirement:</p>

// <p>You must be at least 13 years old, or the minimum age required by applicable local laws.</p>

// <p>4. Profile Information:</p>

// <p>Users are required to provide their full name as part of their profile information.</p>
// <p>Users should also specify their preferred language for app communication.</p>

// <p>5. Social Media Integration (Optional):</p>

// <p>Users may choose to link their social media accounts to facilitate a smoother sign-in process and enhance sharing capabilities.</p>

// <p>6. Location Access (Optional):</p>

// <p>Users may grant permission for location access, enabling the app to provide tailored information about events and actions happening in their vicinity.</p>

// <p>7. Intellectual Property:</p>

// <p>All content within the app is the property of Impacto and is protected by copyright laws.</p>

// <p>8. Limitation of Liability:</p>

// <p>Impacto is not liable for any damages arising from your use of the app.</p>

// <p>9. Changes to Terms:</p>

// <p>We reserve the right to modify these terms at any time. Changes will be posted within the app.</p>
// `;