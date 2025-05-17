document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMenuBtn = document.querySelector('.close-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav ul li a');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        });
    }
    
    if (closeMenuBtn && mobileNav) {
        closeMenuBtn.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Close mobile menu when a link is clicked
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Smooth scrolling for all navigation links (both desktop and mobile)
    const allNavLinks = document.querySelectorAll('nav a[href^="#"], .mobile-nav a[href^="#"]');
    
    allNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form submission handling
    const contactForm = document.querySelector('.contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Simple validation
            if (!name || !email || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Here you would typically send the form data to your backend
            // For now, we'll just show a success message
            alert('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            contactForm.reset();
        });
    }

    // Header scroll effect
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {

        } else {
            header.classList.remove('scrolled');
        }
    });

    // Add animation classes to elements when they come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .about-content, .contact-form, .hero-content, .hero-image');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };
    
    // Initial check for elements in view
    setTimeout(animateOnScroll, 100);
    
    // Check for elements in view on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Floating elements animation enhancement
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach(element => {
        element.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        element.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add active class to navigation links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavOnScroll() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector('nav a[href*=' + sectionId + ']').classList.add('active');
                document.querySelector('.mobile-nav a[href*=' + sectionId + ']').classList.add('active');
            } else {
                document.querySelector('nav a[href*=' + sectionId + ']').classList.remove('active');
                document.querySelector('.mobile-nav a[href*=' + sectionId + ']').classList.remove('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavOnScroll);
});
