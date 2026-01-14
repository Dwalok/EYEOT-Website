// EYEOT Website - Interactive JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Navigation mobile toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.advantage-card, .feature-item, .client-logo').forEach(el => {
        observer.observe(el);
    });
    
    // Parallax effect for hero background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.grid-overlay, .floating-particles');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // Dynamic particle generation
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'dynamic-particle';
        particle.style.cssText = `
            position: fixed;
            width: 2px;
            height: 2px;
            background: #00d4ff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            left: ${Math.random() * window.innerWidth}px;
            top: ${Math.random() * window.innerHeight}px;
            animation: particleFloat ${3 + Math.random() * 4}s ease-in-out infinite;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 7000);
    }
    
    // Create particles periodically
    setInterval(createParticle, 2000);
    
    // Add particle float animation to CSS dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0%, 100% { 
                transform: translateY(0px) translateX(0px);
                opacity: 0;
            }
            10% { opacity: 1; }
            90% { opacity: 1; }
            50% { 
                transform: translateY(-100px) translateX(${Math.random() * 100 - 50}px);
            }
        }
        
        .animate-in {
            animation: slideInUp 0.8s ease-out forwards;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Interactive IoT network visualization
    const centralHub = document.querySelector('.hub-core');
    const sensorNodes = document.querySelectorAll('.node');
    
    // Add hover effects to sensor nodes
    sensorNodes.forEach((node, index) => {
        node.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.5)';
            this.style.boxShadow = '0 0 20px #10b981';
            
            // Highlight connection lines
            const connectionLine = document.querySelector(`.line-${index + 1}`);
            if (connectionLine) {
                connectionLine.style.background = 'linear-gradient(90deg, #10b981, #00d4ff)';
                connectionLine.style.boxShadow = '0 0 10px #10b981';
            }
        });
        
        node.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
            
            // Reset connection lines
            const connectionLine = document.querySelector(`.line-${index + 1}`);
            if (connectionLine) {
                connectionLine.style.background = 'linear-gradient(90deg, #00d4ff, transparent)';
                connectionLine.style.boxShadow = 'none';
            }
        });
    });
    
    // Central hub click effect
    centralHub.addEventListener('click', function() {
        this.style.transform = 'scale(1.2)';
        this.style.boxShadow = '0 0 30px #00d4ff';
        
        // Pulse all nodes
        sensorNodes.forEach((node, index) => {
            setTimeout(() => {
                node.style.transform = 'scale(1.3)';
                node.style.boxShadow = '0 0 15px #10b981';
                
                setTimeout(() => {
                    node.style.transform = 'scale(1)';
                    node.style.boxShadow = 'none';
                }, 300);
            }, index * 100);
        });
        
        setTimeout(() => {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        }, 1000);
    });
    
    // Dashboard mockup interactions
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const metricCards = document.querySelectorAll('.metric-card');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
    
    // Animate metric values on scroll
    const metricObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const metricValue = entry.target.querySelector('.metric-value');
                const finalValue = metricValue.textContent;
                const isPercentage = finalValue.includes('%');
                const isTime = finalValue.includes('ms');
                const isData = finalValue.includes('TB');
                const isCount = finalValue.includes('M');
                
                let numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
                let currentValue = 0;
                const increment = numericValue / 50;
                
                const counter = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= numericValue) {
                        currentValue = numericValue;
                        clearInterval(counter);
                    }
                    
                    let displayValue = Math.floor(currentValue);
                    if (isPercentage) displayValue += '%';
                    else if (isTime) displayValue += 'ms';
                    else if (isData) displayValue += 'TB';
                    else if (isCount) displayValue += 'M';
                    
                    metricValue.textContent = displayValue;
                }, 30);
            }
        });
    }, { threshold: 0.5 });
    
    metricCards.forEach(card => {
        metricObserver.observe(card);
    });
    
    // Button hover effects
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(1.02)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
    });
    
    // Server rack animation on scroll
    const serverRack = document.querySelector('.server-rack');
    const serverObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const servers = entry.target.querySelectorAll('.server');
                servers.forEach((server, index) => {
                    setTimeout(() => {
                        server.style.background = 'linear-gradient(45deg, #1a1a1a, #00d4ff, #1a1a1a)';
                        server.style.backgroundSize = '200% 200%';
                        server.style.animation = 'serverGlow 2s ease-in-out';
                    }, index * 200);
                });
            }
        });
    }, { threshold: 0.5 });
    
    if (serverRack) {
        serverObserver.observe(serverRack);
    }
    
    // Add server glow animation
    const serverGlowStyle = document.createElement('style');
    serverGlowStyle.textContent = `
        @keyframes serverGlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
    `;
    document.head.appendChild(serverGlowStyle);
    
    // Typing effect for hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const titleLines = heroTitle.querySelectorAll('.title-line');
        titleLines.forEach((line, index) => {
            const text = line.textContent;
            line.textContent = '';
            line.style.opacity = '0';
            
            setTimeout(() => {
                line.style.opacity = '1';
                let i = 0;
                const typeWriter = setInterval(() => {
                    if (i < text.length) {
                        line.textContent += text.charAt(i);
                        i++;
                    } else {
                        clearInterval(typeWriter);
                    }
                }, 100);
            }, index * 1000);
        });
    }
    
    // Scroll progress indicator
    const scrollProgress = document.createElement('div');
    scrollProgress.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #00d4ff, #8b5cf6, #10b981);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(scrollProgress);
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    });
    
    // Performance optimization: Throttle scroll events
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Apply throttling to scroll events
    const throttledScroll = throttle(function() {
        // Scroll-based animations here
    }, 16); // ~60fps
    
    window.addEventListener('scroll', throttledScroll);
    
    // Keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
    
    // Focus management for accessibility
    const focusableElements = document.querySelectorAll('button, a, input, textarea, select');
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid #00d4ff';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
    
    // Preload critical images (if any)
    const preloadImages = () => {
        // Add any critical image URLs here
        const imageUrls = [];
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    };
    
    preloadImages();
    
    // Service Worker registration for PWA capabilities (optional)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Uncomment if you want to add a service worker
            // navigator.serviceWorker.register('/sw.js');
        });
    }
    
    // Contact form handling
    const contactForm = document.querySelector('.form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Simple validation
            if (!data.name || !data.email || !data.subject || !data.message) {
                showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Veuillez entrer une adresse email valide.', 'error');
                return;
            }
            
            // Simulate form submission
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Envoi en cours...</span>';
            submitButton.disabled = true;
            
            setTimeout(() => {
                showNotification('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.', 'success');
                this.reset();
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 2000);
        });
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'var(--primary-green)' : type === 'error' ? '#ef4444' : 'var(--primary-blue)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // Console welcome message
    console.log(`
    🚀 EYEOT - The Future of Massive IoT Connectivity
    ================================================
    
    Welcome to the EYEOT website! 
    Built with modern web technologies and optimized for performance.
    
    Features:
    ✅ Responsive design
    ✅ Smooth animations
    ✅ Accessibility optimized
    ✅ Performance optimized
    ✅ Modern CSS Grid & Flexbox
    ✅ Interactive elements
    ✅ Contact form with validation
    
    For more information, visit our website or contact us.
    `);
    
});

// Utility functions
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Infrastructure Slider Functions
let currentSlideIndex = 1;
const totalSlides = 3;

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    // Remove active class from current slide and dot
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Calculate new slide index
    currentSlideIndex += direction;
    
    // Handle slide boundaries
    if (currentSlideIndex > totalSlides) {
        currentSlideIndex = 1;
    } else if (currentSlideIndex < 1) {
        currentSlideIndex = totalSlides;
    }
    
    // Add active class to new slide and dot
    slides[currentSlideIndex - 1].classList.add('active');
    dots[currentSlideIndex - 1].classList.add('active');
}

function currentSlide(slideNumber) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    // Remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Set current slide index
    currentSlideIndex = slideNumber;
    
    // Add active class to selected slide and dot
    slides[currentSlideIndex - 1].classList.add('active');
    dots[currentSlideIndex - 1].classList.add('active');
}

// Auto-play slider (optional)
function autoPlaySlider() {
    setInterval(() => {
        changeSlide(1);
    }, 8000); // Change slide every 8 seconds
}

// Initialize auto-play when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Start auto-play after a delay
    setTimeout(autoPlaySlider, 3000);
});

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce, throttle, changeSlide, currentSlide };
}
