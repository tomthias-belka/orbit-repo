// Presentation Navigation Script

let currentSlide = 1;
const totalSlides = 15;

// DOM Elements
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentSlideEl = document.querySelector('.current-slide');
const totalSlidesEl = document.querySelector('.total-slides');

// Initialize
function init() {
  updateSlideDisplay();
  updateNavigationButtons();
  updateCounter();
}

// Navigate to specific slide
function goToSlide(slideNumber) {
  if (slideNumber < 1 || slideNumber > totalSlides) return;
  
  // Remove active class from all slides
  slides.forEach(slide => {
    slide.classList.remove('active', 'prev');
  });
  
  // Add active class to current slide
  const targetSlide = document.querySelector(`[data-slide="${slideNumber}"]`);
  if (targetSlide) {
    targetSlide.classList.add('active');
  }
  
  // Add prev class to slides before current
  slides.forEach(slide => {
    const slideNum = parseInt(slide.getAttribute('data-slide'));
    if (slideNum < slideNumber) {
      slide.classList.add('prev');
    }
  });
  
  currentSlide = slideNumber;
  updateNavigationButtons();
  updateCounter();
}

// Update slide display
function updateSlideDisplay() {
  slides.forEach((slide, index) => {
    const slideNum = index + 1;
    if (slideNum === currentSlide) {
      slide.classList.add('active');
    } else if (slideNum < currentSlide) {
      slide.classList.add('prev');
    } else {
      slide.classList.remove('active', 'prev');
    }
  });
}

// Update navigation button states
function updateNavigationButtons() {
  prevBtn.disabled = currentSlide === 1;
  nextBtn.disabled = currentSlide === totalSlides;
}

// Update slide counter
function updateCounter() {
  currentSlideEl.textContent = currentSlide;
  totalSlidesEl.textContent = totalSlides;
}

// Navigation functions
function nextSlide() {
  if (currentSlide < totalSlides) {
    goToSlide(currentSlide + 1);
  }
}

function prevSlide() {
  if (currentSlide > 1) {
    goToSlide(currentSlide - 1);
  }
}

// Event Listeners
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ': // Space bar
      e.preventDefault();
      nextSlide();
      break;
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault();
      prevSlide();
      break;
    case 'Home':
      e.preventDefault();
      goToSlide(1);
      break;
    case 'End':
      e.preventDefault();
      goToSlide(totalSlides);
      break;
  }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next slide
      nextSlide();
    } else {
      // Swipe right - prev slide
      prevSlide();
    }
  }
}

// Initialize the presentation
init();

// Add smooth entrance animation on load
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease-in';
    document.body.style.opacity = '1';
  }, 100);
});