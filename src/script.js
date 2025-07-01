const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZujZ4v7JwNaJysszkTv04QnIfpafYL-ygHg8IPWkSdzk7_DFEpaho2h8fVCwRSTdnvBqWVXjNp9Qn/pubhtml?gid=0&single=true';

/**
 * Fetches CSV data from a given URL and parses it into an array of objects.
 * Each object represents a row, with keys corresponding to CSV headers.
 * @param {string} url - The URL of the CSV file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of parsed data objects.
 */
async function fetchAndParseCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error("Error fetching or parsing CSV:", error);
        return []; // Return empty array on error
    }
}

/**
 * Parses a CSV string into an array of objects.
 * Assumes the first line is the header row.
 * This simple parser works well for basic CSVs without commas within quoted fields.
 * For more complex CSVs (e.g., with commas inside quoted strings), a dedicated CSV parsing library
 * would be more robust.
 * @param {string} csvString - The raw CSV content as a string.
 * @returns {Array<Object>} An array of objects representing the CSV data.
 */
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] !== undefined ? values[index] : ''; // Handle potential missing values
        });
        data.push(row);
    }
    return data;
}

// Execute the fetch and parse logic once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', async () => {
    const upcomingShowsData = await fetchAndParseCSV(CSV_URL);
    console.log("Parsed Upcoming Shows Data:", upcomingShowsData);

    const upcomingShowsList = document.querySelector('.upcoming-shows ul');
    if (upcomingShowsList && upcomingShowsData.length > 0) {
        upcomingShowsList.innerHTML = ''; // Clear existing static content
        upcomingShowsData.forEach(show => {
            // Basic check to ensure required fields exist before rendering
            if (show.Date && show.Location && show.TicketLink && show.TicketText) {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <i class="fas fa-calendar-alt"></i> ${show.Date} -
                    <i class="fas fa-map-marker-alt"></i> ${show.Location}
                    <a href="${show.TicketLink}" class="ticket-link">${show.TicketText}</a>
                `;
                upcomingShowsList.appendChild(listItem);
            } else {
                console.warn("Skipping malformed or incomplete show data:", show);
            }
        });
    } else if (upcomingShowsList) {
        // Display a message if no shows are found or if there was an error fetching
        upcomingShowsList.innerHTML = '<li>No upcoming shows scheduled at this time. Please check back later!</li>';
    }

    // --- Gallery Logic ---
    const mainGalleryImage = document.getElementById('main-gallery-image'); // The main image display
    const galleryItems = document.querySelectorAll('.gallery-item'); // All clickable thumbnails
    const videoModal = document.getElementById('video-modal'); // The modal overlay
    const videoPlayer = document.getElementById('video-player'); // The iframe for the video
    const closeModalButton = document.querySelector('.close-modal'); // The 'X' button

    if (galleryItems.length > 0) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;

                if (type === 'image') {
                    handleImageClick(item);
                } else if (type === 'video') {
                    handleVideoClick(item);
                }
            });
        });
    }

    function handleImageClick(item) {
        if (!mainGalleryImage) return;
        const thumbnail = item.querySelector('img');
        if (!thumbnail) return;

        const newSrc = thumbnail.src;
        const newAlt = thumbnail.alt;

        // Avoid reloading the same image
        if (newSrc !== mainGalleryImage.src) {
            mainGalleryImage.style.opacity = 0;
            setTimeout(() => {
                mainGalleryImage.src = newSrc;
                mainGalleryImage.alt = newAlt || 'Main showcase image';
                mainGalleryImage.style.opacity = 1;
            }, 400); // This duration should match the transition time in CSS
        }
    }

    function handleVideoClick(item) {
        if (!videoModal || !videoPlayer) return;
        const videoId = item.dataset.videoId;
        if (!videoId) {
            console.error('Video item is missing data-video-id attribute.');
            return;
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        videoPlayer.src = embedUrl;
        videoModal.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeVideoModal() {
        if (!videoModal || !videoPlayer) return;
        videoModal.classList.remove('visible');
        videoPlayer.src = ''; // Stop the video by clearing the src
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Event listeners for closing the modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeVideoModal);
    }
    if (videoModal) {
        // Also close modal if user clicks on the overlay background
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }
});