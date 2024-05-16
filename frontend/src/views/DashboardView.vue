<template>
  <section class="app-main">
    <div class="min-h-screen flex flex-col bg-violet-400 text-white">
      <!-- Header -->
      <header class="bg-violet-700 py-4">
        <div class="container mx-auto px-4 flex justify-between items-center">
          <!-- Logo -->
          <div class="flex items-center">
            <h1 class="text-3xl font-bold cursor-pointer">TUF Vibin</h1>
          </div>
          <!-- User info and Logout button -->
          <div class="flex items-center">
            <p class="cursor-pointer">Welcome, <span class="text-sky-300 font-semibold">{{ username }}</span></p>
            <button @click="logout" class="bg-violet-800 hover:bg-violet-900 rounded-full px-4 py-2 ml-4">Logout</button>
          </div>
        </div>
      </header>
      <!-- Main Content -->
      <div class="container mx-auto px-4 flex flex-grow justify-center">
        <!-- Left Container for Tracks -->
        <div class="w-full sm:w-3/4 p-4">
          <div class="flex items-center justify-center">
  <!-- Search Input -->
  <input v-model="searchQuery" type="text" placeholder="Search music . . ."
    class="text-center flex-grow p-3 rounded-lg bg-violet-600 text-white placeholder-gray-400 focus:outline-none focus:bg-violet-700 border border-black">
  <!-- Search Button -->
  <button @click="search"
    class="ml-2 bg-violet-800 hover:bg-violet-900 text-white rounded-full px-6 py-3 font-semibold text-lg">Search</button>
</div>
          <!-- Searched Tracks -->
          <div v-if="searchedTracks.length > 0" class="mt-4">
            <h2 class="text-xl font-bold mb-2">Searched Tracks</h2>
            <div v-for="track in searchedTracks" :key="track.id" class="cursor-pointer" @click="selectTrack(track)">
              <div class="bg-violet-800 rounded-lg overflow-hidden shadow-lg p-2 mb-1">
                <div class="font-bold text-lg">{{ track.name }}</div>
                <p class="text-gray-400">{{ track.artists[0].name }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Right Column: Chat Application -->
        <!-- Chat content goes here -->
        <div>
  <button @click="toggleChat" class="fixed bottom-4 right-8 bg-violet-500 hover:bg-violet-600 text-white py-2 px-4 rounded-full shadow-lg">
    Chat
  </button>
  <div v-if="showChat" class="fixed right-0 z-10 bg-gray-800 text-white w-45vw md:w-64 h-full p-4 rounded-tl-lg shadow-lg border border-white">
    <button @click="toggleChat" class="absolute top-2 right-2 text-white hover:text-gray-300 focus:outline-none">
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
    <ChatComponent/>
  </div>
</div>
      </div>
      <!-- Selected Track -->
      <div v-if="selectedTrack" class="container mx-auto px-2 flex justify-center mt-2 bottom-center">
        <div class="w-full sm:w-3/4 p-2">
          <div class="bg-violet-800 rounded-lg overflow-hidden shadow-lg">
            <iframe :src="generateEmbedUrl(selectedTrack.id)" width="100%" height="153" frameborder="" allowfullscreen=""
              allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2'; // Import SweetAlert

const searchQuery = ref('');
const searchedTracks = ref([]);
const isLoggedIn = ref(false);
const selectedTrack = ref(null);
const showChat = ref(false);
const username = ref('');
const router = useRouter();

const toggleChat = () => {
  showChat.value = !showChat.value;
};

const search = async () => {
  try {
    const response = await axios.get('http://localhost:3000/search', {
      params: {
        q: searchQuery.value
      }
    });
    searchedTracks.value = response.data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
  }
};

const generateEmbedUrl = (trackId) => {
  return `https://open.spotify.com/embed/track/${trackId}`;
};

const selectTrack = (track) => {
  selectedTrack.value = track;
};

const logout = () => {
  console.log("Logged out!");
  localStorage.removeItem('token');
  router.push('/'); // Redirect to the home page or login page
  // Display SweetAlert after logout
  Swal.fire({
    icon: 'success',
    title: 'Logged out successfully',
    position: 'top',
    showConfirmButton: false,
    timer: 1500,
    customClass: {
      popup: 'my-swal-popup', // Apply custom class for styling popup
      title: 'my-swal-title' // Apply custom class for styling title
    }
  });
};
onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/dashboard', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    message.value = response.data.message;
    isLoggedIn.value = true;

    // Extract username from JWT token payload
    const token = localStorage.getItem('token');
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodes the payload part of the JWT token
    if (decodedToken) {
      username.value = decodedToken.username;
    }
  } catch (error) {
    console.error('Error fetching dashboard message:', error);
  }
});

</script>



<style>
  .bottom-center {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
.my-swal-popup {
  width: 200px;
  /* Adjust width as needed */
  background-color: #4CAF50;
  /* Custom background color */
  color: white;
  /* Custom text color */
}

.my-swal-title {
  font-size: 16px;
  /* Adjust font size as needed */
}
</style>
