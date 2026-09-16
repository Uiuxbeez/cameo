
(function () {
    "use strict";

	function bindMobileMenu() {
		const isMobile = window.innerWidth <= 991;
		const menuLinks = document.querySelectorAll('.main-nav a');
		const allSubmenus = document.querySelectorAll('.main-nav ul ul');
	
		// Helper: Smooth Slide Toggle
		const closeSubmenu = (el) => {
			el.style.height = el.scrollHeight + 'px'; // Start from current height
			el.offsetHeight; // Force reflow
			el.style.transition = "height 350ms ease-in-out";
			el.style.height = '0';
			el.style.overflow = 'hidden';
			setTimeout(() => { if(el.style.height === '0px') el.style.display = 'none'; }, 350);
		};
	
		const openSubmenu = (el) => {
			el.style.display = 'block';
			const height = el.scrollHeight; // Get actual content height
			el.style.height = '0';
			el.style.overflow = 'hidden';
			el.offsetHeight; // Force reflow
			el.style.transition = "height 350ms ease-in-out";
			el.style.height = height + 'px';
			// Cleanup after animation to allow nested menus to expand
			setTimeout(() => { el.style.height = 'auto'; }, 350);
		};
	
		if (isMobile) {
			menuLinks.forEach(link => {
				// Clone and replace to strip all previous event listeners
				const newLink = link.cloneNode(true);
				link.parentNode.replaceChild(newLink, link);
	
				newLink.addEventListener('click', function (e) {
					const parent = this.parentElement;
					const submenu = this.nextElementSibling;
	
					if (parent && parent.classList.contains('has-submenu')) {
						e.preventDefault();
	
						if (this.classList.contains('submenu')) {
							// Close current
							this.classList.remove('submenu');
							if (submenu) closeSubmenu(submenu);
						} else {
							// 1. Close ALL other submenus first (prevents overlap)
							document.querySelectorAll('.main-nav a.submenu').forEach(activeLink => {
								activeLink.classList.remove('submenu');
								const otherSub = activeLink.nextElementSibling;
								if (otherSub) closeSubmenu(otherSub);
							});
	
							// 2. Open this one
							this.classList.add('submenu');
							if (submenu) openSubmenu(submenu);
						}
					}
				});
			});
		} else {
			// Reset for Desktop: Remove all inline styles and classes
			document.querySelectorAll('.main-nav a').forEach(link => link.classList.remove('submenu'));
			allSubmenus.forEach(s => {
				s.style.display = '';
				s.style.height = '';
				s.style.transition = '';
			});
		}
	}
	
	// Initial Run & Resize
	document.addEventListener('DOMContentLoaded', bindMobileMenu);
	window.addEventListener('resize', () => {
		// debounce resize to prevent stuttering
		clearTimeout(window.menuResizeTimer);
		window.menuResizeTimer = setTimeout(bindMobileMenu, 100);
	});	
	
	// Mobile Click
	document.addEventListener("click", function (e) {
		const mobileBtn = e.target.closest("#mobile_btn");
		if (!mobileBtn) return;

		e.preventDefault();
		document.querySelectorAll("main-wrapper").forEach((el) => {
			el.classList.toggle("slide-nav");
		});
		document.querySelectorAll(".menu-overlay").forEach((el) => {
			el.classList.add("opened");
		});
		document.querySelectorAll(".sidebar-overlay").forEach((el) => {
			el.classList.add("opened");
		});
		document.documentElement.classList.add("menu-opened");
	});
	
	// Overlay
	document.addEventListener("click", function (e) {
		const sidebarOverlay = e.target.closest(".sidebar-overlay");
		const menuOverlay = e.target.closest(".menu-overlay");
		const clickedOverlay = sidebarOverlay || menuOverlay;
		if (!clickedOverlay) return;

		document.documentElement.classList.remove("menu-opened");
		clickedOverlay.classList.remove("opened");
		document.querySelectorAll("main-wrapper").forEach((el) => {
			el.classList.remove("slide-nav");
		});
	});
	
	// Menu Close
	document.addEventListener("click", function (e) {
		const menuClose = e.target.closest("#menu_close");
		if (!menuClose) return;

		e.preventDefault();
		document.documentElement.classList.remove("menu-opened");
		document.querySelectorAll(".sidebar-overlay").forEach((el) => {
			el.classList.remove("opened");
		});
		document.querySelectorAll("main-wrapper").forEach((el) => {
			el.classList.remove("slide-nav");
		});
	});

	// Loader
	window.addEventListener('load', function () {
		const circleLoader = document.querySelector('[data-loader="circle-side"]');
		const preloader = document.getElementById('preloader');

		// 1. Hide the inner circle immediately
		if (circleLoader) {
			circleLoader.style.display = 'none';
		}

		// 2. Delay the main preloader fade (mimicking .delay(350))
		setTimeout(() => {
			if (preloader) {
				// Apply a smooth transition
				preloader.style.transition = 'opacity 0.6s ease'; 
				preloader.style.opacity = '0';

				// Remove from layout after fade finishes
				setTimeout(() => {
					preloader.style.display = 'none';
					// Restore scrolling to the body
					document.body.style.overflow = 'visible';
				}, 600); 
			}
		}, 350);
	});

	// Animation
	const tiltElements = document.getElementsByClassName('tilt');

	Array.from(tiltElements).forEach(el => {
	const height = el.clientHeight;
	const width = el.clientWidth;

	el.addEventListener('mousemove', function (e) {
		const xVal = e.layerX;
		const yVal = e.layerY;

		const yRotation = 50 * ((xVal - width / 2) / width);
		const xRotation = -50 * ((yVal - height / 2) / height);

		const string =
		'perspective(600px) scale(1) rotateX(' +
		xRotation +
		'deg) rotateY(' +
		yRotation +
		'deg)';

		el.style.transform = string;
	});

	el.addEventListener('mouseout', function () {
		el.style.transform =
		'perspective(600px) scale(1) rotateX(0) rotateY(0)';
	});

	el.addEventListener('mousedown', function () {
		el.style.transform =
		'perspective(600px) scale(0.9) rotateX(0) rotateY(0)';
	});

	el.addEventListener('mouseup', function () {
		el.style.transform =
		'perspective(600px) scale(1) rotateX(0) rotateY(0)';
	});
	});

	// Heart Filled Toggle
	document.addEventListener('click', (event) => {
		// 1. Find the parent container and the icon
		const favContainer = event.target.closest('.favourite');
		
		if (favContainer) {
			const favIcon = favContainer.querySelector('i');

			// 2. Toggle 'selected' on the container
			favContainer.classList.toggle('selected');

			// 3. Toggle the icon classes and 'filled' class
			if (favIcon) {
				favIcon.classList.toggle('ti-heart');
				favIcon.classList.toggle('ti-heart-filled');
				favIcon.classList.toggle('filled');
			}
		}
	});

	// Reusable "Show More/Less" Toggle
	for (let i = 0; i <= 6; i++) {
		const suffix = i || '';
		const moreMenu = document.querySelector(`.more-menu${suffix}`);
		const viewAllBtn = document.querySelector(`.viewall${suffix}-button`);

		if (moreMenu && viewAllBtn) {
			moreMenu.style.maxHeight = "0px";
			moreMenu.style.overflow = "hidden";
			moreMenu.style.transition = "max-height 0.6s ease-in-out";

			// Add 'e' (event) parameter here
			viewAllBtn.addEventListener("click", function (e) {
				e.preventDefault(); // <--- THIS STOPS THE PAGE JUMPING TO TOP

				const isClosed = moreMenu.style.maxHeight === "0px";

				if (isClosed) {
					moreMenu.style.maxHeight = moreMenu.scrollHeight + "px";
					this.textContent = "Show Less";
				} else {
					moreMenu.style.maxHeight = "0px";
					this.textContent = "Show More";
				}
			});
		}
	}	

	// CounterUp Initialization
	const counters = document.querySelectorAll('.counter');

	counters.forEach(counter => {
		let started = false;

		const observer = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && !started) {
				started = true;

				let count = 0;
				const target = +counter.innerText;
				const increment = target / 100;

				const update = () => {
					count += increment;
					if (count < target) {
						counter.innerText = Math.ceil(count);
						requestAnimationFrame(update);
					} else {
						counter.innerText = target;
					}
				};

				update();
			}
		}, { threshold: 0.8 });

		observer.observe(counter);
	});

	// Sticky Header
	window.addEventListener("scroll", function () {
		const header = document.querySelector("header.header");
		if (!header) return;
		if (window.scrollY > 130) {
			header.classList.add("fixed");
		} else {
			header.classList.remove("fixed");
			header.classList.add("fadeInUp");
		}
	});

	// Horizontal Slide (Infinite Scroll)
	document.addEventListener("DOMContentLoaded", function () {
		document.querySelectorAll(".horizontal-slide").forEach(scroller => {
			scroller.setAttribute("data-animated", true);
			const scrollerInner = scroller.querySelector(".slide-list");
			const scrollerContent = Array.from(scrollerInner.children);
			scrollerContent.forEach(item => {
				const clone = item.cloneNode(true);
				clone.setAttribute("aria-hidden", true);
				scrollerInner.appendChild(clone);
			});
		});
	});

	// Toggle Password
	document.addEventListener('click', function (event) {
		// Check if the clicked element (or its parent) is the toggle button
		const toggleBtn = event.target.closest('.toggle-password');
		
		if (toggleBtn) {
			const icon = toggleBtn.querySelector('i');
			const inputGroup = toggleBtn.closest('.input-group');
			const input = inputGroup ? inputGroup.querySelector('.pass-input') : null;

			if (input && input.type === 'password') {
				input.type = 'text';
				icon.classList.replace('ti-eye-off', 'ti-eye');
			} else if (input) {
				input.type = 'password';
				icon.classList.replace('ti-eye', 'ti-eye-off');
			}
		}
	});

    // Cart Count
    document.addEventListener("DOMContentLoaded", function () {
		// Select the actual parent class from your HTML
		document.querySelectorAll(".quantity-item").forEach(container => {
			const input = container.querySelector(".quantity-input");
			const plusBtn = container.querySelector(".add-btn");
			const minusBtn = container.querySelector(".minus-btn");

			plusBtn.addEventListener("click", () => {
				let currentValue = parseInt(input.value) || 0;
				input.value = currentValue + 1;
			});

			minusBtn.addEventListener("click", () => {
				let currentValue = parseInt(input.value) || 0;
				if (currentValue > 1) {
					input.value = currentValue - 1;
				}
			});
		});
	});

	// Payment Options
	const paymentSection = document.getElementById("payment-options");
	if (paymentSection) {
		const contents = document.querySelectorAll(".payment-content");
		const hideAllContents = function () {
			contents.forEach((content) => content.classList.add("d-none"));
		};
		const showContent = function (suffix) {
			const target = document.getElementById("payment-content-" + suffix);
			if (target) {
				target.classList.remove("d-none");
			}
		};

		paymentSection.querySelectorAll('input[type="radio"]').forEach((radio) => {
			radio.addEventListener("click", function () {
				if (this.checked) {
					hideAllContents();
					const suffix = this.id.replace("payment-", "");
					showContent(suffix);
				}
			});
		});

		paymentSection.querySelectorAll(".form-check").forEach((formCheck) => {
			formCheck.addEventListener("click", function (e) {
				if (e.target.matches("input")) return;
				const radio = this.querySelector('input[type="radio"]');
				if (radio) {
					radio.checked = true;
					radio.dispatchEvent(new Event("click", { bubbles: true }));
				}
			});
		});

		hideAllContents();
		showContent("credit");
	}

	// Animate Button
	document.querySelectorAll(".animate-button").forEach((e) => {
		const t = e.getAttribute("data-text"),
			n = e.querySelector(".button-text");
		n.innerHTML = "";
		const s = t.split(""),
			o = 360 / s.length;
		s.forEach((e, t) => {
			const s = document.createElement("span");
			(s.textContent = e),
				s.style.setProperty("--index", t),
				s.style.setProperty("--angle", o),
				n.appendChild(s);
		});
	});

	// Use querySelectorAll to handle zero, one, or many buttons safely
	const animatedButtons = document.querySelectorAll('.animate-button2');

	animatedButtons.forEach(btn => {
		const textContainer = btn.querySelector('.button-text2');
		const text = btn.getAttribute('data-text');

		if (textContainer && text) {
			// Split the text into characters
			const characters = text.split('');
			const angleStep = 360 / characters.length;

			// Set the angle variable on this specific button
			btn.style.setProperty('--angle', angleStep);

			// Map characters to spans with their specific index
			textContainer.innerHTML = characters.map((char, i) => {
				return `<span style="--index: ${i}">${char}</span>`;
			}).join('');
		}
	});

	// Wow Animation
	if (typeof WOW !== "undefined") {
		new WOW({
			offset: 0,
			mobile: true
		}).init();
	}

	// Article Hover
	const items = document.querySelectorAll('.article-item-two');
		items.forEach(item => {
		item.addEventListener('mouseenter', () => {
			// remove active from all
			items.forEach(i => i.classList.remove('active'));
			// add active only to hovered one
			item.classList.add('active');
		});
	});

	// Video
	const videoSection = document.querySelector('.video-section video');
		const videoBtn = document.querySelector('.video-btn');

		if (videoSection && videoBtn) {
		videoBtn.addEventListener('click', function () {
			if (videoSection.paused) {
			videoSection.play();
			} else {
			videoSection.pause();
			}
		});
	}

	const formChecks = document.querySelectorAll('.payment-options .form-check');

	formChecks.forEach(check => {
		check.addEventListener('click', () => {
			// Remove active from all
			formChecks.forEach(c => {
				c.classList.remove('active');
				c.querySelector('input').checked = false;
			});

			// Add active to clicked
			check.classList.add('active');
			check.querySelector('input').checked = true;
		});
	});

	document.addEventListener('DOMContentLoaded', function () {

		const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	
		let today = new Date();
		let totalDays = 14;
	
		let html = '';
	
		for (let i = 0; i < totalDays; i++) {
			let date = new Date();
			date.setDate(today.getDate() + i);
	
			let day = days[date.getDay()];
			let month = months[date.getMonth()];
			let dayNum = date.getDate().toString().padStart(2, '0');
	
			html += `
			<div class="swiper-slide">
				<label>
					<input type="radio" name="appointment-date" ${i === 0 ? 'checked' : ''}>
					<div class="booking-appointment-slide">
						<span>${month}</span>
						<h2 class="date-bold">${dayNum}</h2>
						<span>${day}</span>
					</div>
				</label>
			</div>
			`;
		}		
	
		document.querySelectorAll('.booking-appointment-slider').forEach(slider => {
			const wrapper = slider.querySelector('.swiper-wrapper');

			if (wrapper) {
				wrapper.innerHTML = html;
			}
		});
	
	});

	document.addEventListener('change', (event) => {
		// 1. Check if the changed element is the correct input
		if (event.target.matches('input[name="appointment-time"]')) {
			
			// 2. Find the closest parent with the badge class
			const badge = event.target.closest('.booking-appointment-badge');
			
			if (badge) {
				// 3. Get the text content and trim whitespace
				const selected = badge.textContent.trim();
				console.log("Selected:", selected);
			}
		}
	});

	// Choices
	function initChoices() {
		document.querySelectorAll("[data-choices]").forEach((item) => {
			const config = {
				allowHTML: true,
			};
			const attrs = item.attributes;

			if (attrs["data-choices-groups"]) {
				config.placeholderValue = "This is a placeholder set in the config";
			}
			if (attrs["data-choices-search-false"]) {
				config.searchEnabled = false;
			}
			if (attrs["data-choices-search-true"]) {
				config.searchEnabled = true;
			}
			if (attrs["data-choices-removeItem"]) {
				config.removeItemButton = true;
			}
			if (attrs["data-choices-sorting-false"]) {
				config.shouldSort = false;
			}
			if (attrs["data-choices-sorting-true"]) {
				config.shouldSort = true;
			}
			if (attrs["data-choices-multiple-remove"]) {
				config.removeItemButton = true;
			}
			if (attrs["data-choices-limit"]) {
				config.maxItemCount = parseInt(attrs["data-choices-limit"].value);
			}
			if (attrs["data-choices-editItem-true"]) {
				config.editItems = true;
			}
			if (attrs["data-choices-editItem-false"]) {
				config.editItems = false;
			}
			if (attrs["data-choices-text-unique-true"]) {
				config.duplicateItemsAllowed = false;
			}
			if (attrs["data-choices-text-disabled-true"]) {
				config.addItems = false;
			}

			const instance = new Choices(item, config);

			if (attrs["data-choices-text-disabled-true"]) {
				instance.disable();
			}
		});
	}

	// Call it when the DOM is ready
	document.addEventListener("DOMContentLoaded", initChoices);

	document.querySelectorAll('.coupon-code-copy').forEach(button => {
		button.addEventListener('click', function () {
	
			// Clone button and remove icon
			let clone = this.cloneNode(true);
			clone.querySelectorAll('*').forEach(el => el.remove());
	
			let text = clone.textContent.trim();
	
			// Copy to clipboard
			navigator.clipboard.writeText(text);
	
			// Change button text
			this.innerHTML = 'Copied!';
	
			// Reset after 2 seconds
			setTimeout(() => {
				this.innerHTML = 'FIRST BOOKING <i class="ti ti-copy ms-2"></i>';
			}, 2000);
		});
	});

	document.addEventListener('DOMContentLoaded', function () {

		const staffs = document.querySelectorAll('.available-staff');
	
		staffs.forEach(staff => {
			staff.addEventListener('click', function () {
	
				// Remove active from all
				staffs.forEach(item => {
					item.classList.remove('active');
	
					const btn = item.querySelector('.check-btn');
					if (btn) {
						btn.innerHTML = '<i class="ti ti-plus"></i>';
					}
				});
	
				// Add active to clicked
				this.classList.add('active');
	
				const currentBtn = this.querySelector('.check-btn');
				if (currentBtn) {
					currentBtn.innerHTML = '<i class="ti ti-check"></i>';
				}
			});
		});
	
	});

	// Delivery Item
	document.querySelectorAll(".delivery-item").forEach((item) => {
		item.addEventListener("click", function () {
		const radio = document.getElementById(this.getAttribute("data-radio"));
		if (radio) radio.checked = true;
			document.querySelectorAll(".delivery-item").forEach((el) => el.classList.remove("active"));
			this.classList.add("active");
		});
	});

	// Booking Count down
	document.addEventListener("DOMContentLoaded", function () {

		function startCountdown(duration, elementId) {
			let timer = duration;

			const display = document.getElementById(elementId);
			if (!display) return; // safety check

			const interval = setInterval(function () {

				let days = Math.floor(timer / (24 * 3600));
				let minutes = Math.floor((timer % 3600) / 60);
				let seconds = timer % 60;

				// format values
				days = String(days).padStart(2, '0');
				minutes = String(minutes).padStart(2, '0');
				seconds = String(seconds).padStart(2, '0');

				display.textContent = `${days}d : ${minutes}m : ${seconds}s`;

				if (timer <= 0) {
					clearInterval(interval);
					display.textContent = "Expired";
				}

				timer--;

			}, 1000);
		}

		// ✅ Set your time here (2 days + 30 minutes)
		const duration = (2 * 24 * 60 * 60) + (30 * 60);

		// ✅ Call function with ID
		startCountdown(duration, "countdown");

	});

	// Color Selection
	const colorContainer = document.querySelector('.color-selection');

	if (colorContainer) {
		colorContainer.addEventListener('click', (event) => {
			const clickedItem = event.target.closest('.color-item');
			
			if (clickedItem) {
				// Remove from all siblings
				colorContainer.querySelectorAll('.color-item').forEach(el => el.classList.remove('active'));
				// Add to clicked
				clickedItem.classList.add('active');
			}
		});
	}

	// Initialize Flatpickr on elements with data-provider="flatpickr"
	document.querySelectorAll('[data-provider="flatpickr"]').forEach(el => {
		const config = {
			disableMobile: true
		};
		if (el.hasAttribute('data-date-format')) {
			config.dateFormat = el.getAttribute('data-date-format');
		}
		if (el.hasAttribute('data-enable-time')) {
			config.enableTime = true;
			config.dateFormat = config.dateFormat ? `${config.dateFormat} H:i` : 'Y-m-d H:i';
		}
		if (el.hasAttribute('data-altFormat')) {
			config.altInput = true;
			config.altFormat = el.getAttribute('data-altFormat');
		}
		if (el.hasAttribute('data-minDate')) {
			config.minDate = el.getAttribute('data-minDate');
		}
		if (el.hasAttribute('data-maxDate')) {
			config.maxDate = el.getAttribute('data-maxDate');
		}
		if (el.hasAttribute('data-default-date')) {
			config.defaultDate = el.getAttribute('data-default-date');
		}
		if (el.hasAttribute('data-multiple-date')) {
			config.mode = 'multiple';
		}
		if (el.hasAttribute('data-range-date')) {
			config.mode = 'range';
		}
		if (el.hasAttribute('data-inline-date')) {
			config.inline = true;
			config.defaultDate = el.getAttribute('data-inline-date');
		}
		if (el.hasAttribute('data-disable-date')) {
			config.disable = el.getAttribute('data-disable-date').split(',');
		}
		if (el.hasAttribute('data-week-number')) {
			config.weekNumbers = true;
		}
		if (el.hasAttribute('data-month-only')) {
        config.plugins = [
            new monthSelectPlugin({
                shorthand: true, // Shows "Jan" instead of "January"
                dateFormat: el.getAttribute('data-date-format') || "M, Y",
                altFormat: "F Y",
                theme: "light"
            })
        ];
    }
		flatpickr(el, config);
	});

	// Sidebar
	function initSidebar() {
		const sidebar = document.querySelector('.sidebar-menu');
		if (!sidebar) return;

		// Handle Click Events (Delegation)
		sidebar.addEventListener('click', function (e) {
			const target = e.target.closest('a');
			if (!target) return;

			const parent = target.parentElement;
			const submenu = target.nextElementSibling;

			if (parent.classList.contains('submenu')) {
				e.preventDefault();

				// Check if submenu exists and is a UL
				if (submenu && submenu.tagName === 'UL') {
					const currentMenu = target.closest('ul');

					if (!target.classList.contains('subdrop')) {
						// Close other open submenus in the same list
						currentMenu.querySelectorAll('ul').forEach(ul => {
							ul.style.display = 'none';
						});
						currentMenu.querySelectorAll('a').forEach(a => {
							a.classList.remove('subdrop');
						});

						// Open current
						submenu.style.display = 'block';
						target.classList.add('subdrop');
					} else {
						// Close current
						target.classList.remove('subdrop');
						submenu.style.display = 'none';
					}
				}
			}
		});

		// Auto-expand active submenus on load
		document.querySelectorAll('.sidebar-menu ul li.submenu a.active').forEach(activeLink => {
			let parentLi = activeLink.closest('li.submenu');
			while (parentLi) {
				const menuHandle = parentLi.querySelector('a');
				const subUl = menuHandle.nextElementSibling;
				
				menuHandle.classList.add('active', 'subdrop');
				if (subUl) subUl.style.display = 'block';
				
				// Look for nested parents
				parentLi = parentLi.parentElement.closest('li.submenu');
			}
		});
	}

	// Run on load
	document.addEventListener('DOMContentLoaded', initSidebar);

	// Copy Code
	document.querySelectorAll('.copy-btn').forEach(button => {
		button.addEventListener('click', function(event) {
			event.preventDefault(); // Stop the link from jumping the page

			// 1. Get the parent badge and its text content
			const badge = this.closest('.copy-code');
			// .innerText ignores the hidden icon/link text better than .textContent
			const textToCopy = badge.innerText.trim();

			// 2. Copy to Clipboard
			navigator.clipboard.writeText(textToCopy).then(() => {
				// 3. Visual Feedback: Change the icon temporarily
				const icon = this.querySelector('i');
				icon.classList.replace('ti-copy', 'ti-check');
				
				// 4. Reset after 2 seconds
				setTimeout(() => {
					icon.classList.replace('ti-check', 'ti-copy');
				}, 2000);
			});
		});
	});

	// Top Icon
	document.addEventListener("DOMContentLoaded", function () {
		const btn = document.querySelector(".back-to-top-icon");
		if (!btn) return;

		window.onscroll = () => btn.classList.toggle("show", window.scrollY >= 300);

		btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
	});

	// Select the elements
    document.addEventListener("DOMContentLoaded", function () {
    const thumbEl = document.querySelector("#small-img");
    const mainEl = document.querySelector("#large-img");

    if (thumbEl && mainEl) {

			var swiperThumbs = new Swiper(thumbEl, {
				spaceBetween: 24,
				slidesPerView: 3,
				freeMode: true,
				watchSlidesProgress: true,
			});

			var swiperMain = new Swiper(mainEl, {
				spaceBetween: 0,
				navigation: false,
				thumbs: {
					swiper: swiperThumbs,
				},
			});
		}
	});

	// Brand Slider
	const brandSliders = document.querySelectorAll('.brand-slider-six');

	brandSliders.forEach((slider) => {
		new Swiper(slider, {
			// Default settings (Mobile: 0px to 575px)
			slidesPerView: 2,
			spaceBetween: 20,
			loop: true,
			speed: 1000,
			autoplay: false,
			
			breakpoints: {
				576: {
					slidesPerView: 3,
				},
				// when window width is >= 768px
				768: {
					slidesPerView: 3,
				},
				// when window width is >= 992px
				992: {
					slidesPerView: 4,
				},
				// when window width is >= 1300px
				1300: {
					slidesPerView: 5,
				},
				// when window width is >= 1500px
				1500: {
					slidesPerView: 6,
				}
			}
		});
	});

	// Testimonial Slider
	const testimonialSliders = document.querySelectorAll('.testimonials-slider');

	testimonialSliders.forEach((slider) => {
		new Swiper(slider, {
			slidesPerView: 1,      // Default (Mobile)
			spaceBetween: 24,     // Gap between slides
			loop: true,
			speed: 2000,
			autoplay: false,
			autoHeight: true,     // Equivalent to adaptiveHeight: true
			
			// Custom External Navigation
			navigation: {
				nextEl: '.testimonial-next',
				prevEl: '.testimonial-prev',
			},

			// Responsive Breakpoints
			breakpoints: {
				768: {
					slidesPerView: 1,
				},
				992: {
					slidesPerView: 1,
				},
				1200: {
					slidesPerView: 2,
				},
				1400: { // Added to handle the "3 slides" desktop view
					slidesPerView: 3,
				}
			}
		});
	});

	// Testimonial Slider
	const testimonialSix = document.querySelectorAll('.testimonials-slider-six');

	testimonialSix.forEach((slider) => {
		new Swiper(slider, {
			slidesPerView: 1,      // Default mobile
			spaceBetween: 40,
			loop: false,
			speed: 2000,
			autoHeight: true,      // Equivalent to adaptiveHeight: true
			slidesOffsetBefore: 30, // Space before the first slide in pixels
			slidesOffsetAfter: 30, 
			autoplay: {
				delay: 3000,       // Adjust delay as needed
				disableOnInteraction: false,
			},
			
			// Responsive breakpoints (Swiper is mobile-first: min-width)
			breakpoints: {
				576: {
					slidesPerView: 2,
				},
				768: {
					slidesPerView: 2,
				},
				992: {
					slidesPerView: 3,
				},
				1200: {
					slidesPerView: 4,
				},
				1500: {
					slidesPerView: 4,
				}
			}
		});
	});

	// Gallery Slider
	const gallerySliders = document.querySelectorAll('.gallery-slider-five');

	gallerySliders.forEach((slider) => {
		new Swiper(slider, {
			slidesPerView: 1,      // Default for < 450px
			spaceBetween: 24,     // Gap between images
			loop: false,
			speed: 1000,
			autoplay: {
				delay: 2000,
				disableOnInteraction: false,
			},
			
			// Add space at the start and end of the slider
			slidesOffsetBefore: 12, 
			slidesOffsetAfter: 12,

			// Responsive Breakpoints (Mapping from Slick)
			breakpoints: {
				450: {
					slidesPerView: 1,
				},
				576: {
					slidesPerView: 2,
				},
				768: {
					slidesPerView: 3,
				},
				992: {
					slidesPerView: 4,
				},
				1300: {
					slidesPerView: 4,
				},
				1500: {
					slidesPerView: 4,
					slidesOffsetBefore: 12, // More space on larger screens
					slidesOffsetAfter: 12,
				}
			}
		});
	});

	// Testimonial Slider
	const testimonialFive = document.querySelectorAll('.testimonial-slider-five');

	testimonialFive.forEach((slider) => {
		new Swiper(slider, {
			slidesPerView: 1,
			spaceBetween: 24, // Remove gap between slides
			loop: false,
			centeredSlides: false, // Set to true if you want the active slide in middle
			speed: 1000,
			autoplay: {
				delay: 2000,
				disableOnInteraction: false,
			},
			pagination: {
				el: slider.querySelector('.swiper-pagination'),
				clickable: true,
			},
			// Add space at the start and end of the slider
			slidesOffsetBefore: 12, 
			slidesOffsetAfter: 12,
			breakpoints: {
				// When window width is >= 0px
				0: { slidesPerView: 1 },
				// When window width is >= 768px
				768: { slidesPerView: 2 },
				// When window width is >= 992px
				992: { slidesPerView: 2 },
				// When window width is >= 1200px
				1200: { slidesPerView: 3 }
			}
		});
	});

	// Category
	document.addEventListener('DOMContentLoaded', function () {
		const categorySliders = document.querySelectorAll('.category-slider');

		categorySliders.forEach(function (slider) {
			new Swiper(slider, {
				spaceBetween: 24, // Remove gap between slides
				loop: false,
				centeredSlides: false, // Set to true if you want the active slide in middle
				speed: 1000,
				autoplay: {
					delay: 2000,
					disableOnInteraction: false,
				},
				pagination: {
                el: '.swiper-pagination',
                clickable: true, // Allows clicking dots to change slides
            },
				// Add space at the start and end of the slider
				slidesOffsetBefore: 12, 
				slidesOffsetAfter: 12,
				breakpoints: {
					0: { slidesPerView: 1 },
					576: { slidesPerView: 2 },
					768: { slidesPerView: 3 },
					992: { slidesPerView: 3 },
					1200: { slidesPerView: 4 },
					1400: { slidesPerView: 5 }
				}
			});
		});
	});

	// Banner Slider
	document.addEventListener('DOMContentLoaded', function () {
		// 1. Get the list of elements
		const bannerSliders = document.querySelectorAll('.banner-slider');

		// 2. Loop through them
		bannerSliders.forEach((slider) => {
			// 3. Pass the 'slider' VARIABLE (the element), NOT the string '.banner-slider'
			new Swiper(slider, { 
				effect: 'fade',
				fadeEffect: {
					crossFade: true
				},
				loop: true,
				speed: 1000,
				autoplay: {
					delay: 3000,
					disableOnInteraction: false,
				},
				// Custom External Navigation
				navigation: {
					nextEl: '.banner-next',
					prevEl: '.banner-prev',
				},

			});
		});
	});

	// Blog Slider
	const blogListSliders = document.querySelectorAll('.blog-list-slider');

	blogListSliders.forEach((slider) => {
		// Find the specific parent to locate this slider's unique arrows
		const parent = slider.closest('.blog-list-slider-cover');
		const prevBtn = parent ? parent.querySelector('.blog-list-prev') : null;
		const nextBtn = parent ? parent.querySelector('.blog-list-next') : null;

		new Swiper(slider, {
			slidesPerView: 1,
			loop: true,
			speed: 500,
			autoplay: false,
			
			// Connect the localized navigation buttons
			navigation: {
				nextEl: nextBtn,
				prevEl: prevBtn,
			},

			// Breakpoints (Simplified since all are 1 slide)
			breakpoints: {
				0: { slidesPerView: 1 }
			}
		});
	});

	// Booking Slider
	document.addEventListener("DOMContentLoaded", function () {

		const sliders = document.querySelectorAll('.booking-appointment-slider');

		sliders.forEach((slider) => {

			const container = slider.closest('.booking-appointment-container');
			const offcanvas = slider.closest('.offcanvas');

			const nextBtn = container?.querySelector('.appointment-next');
			const prevBtn = container?.querySelector('.appointment-prev');

			let swiperInstance = null;

			const initSwiper = () => {

				// Destroy if exists
				if (swiperInstance) {
					swiperInstance.destroy(true, true);
					swiperInstance = null;
				}

				if (!slider || !(slider instanceof Element)) return;

				swiperInstance = new Swiper(slider, {
					slidesPerView: 2,
					spaceBetween: 10,
					observer: true,
					observeParents: true,
					watchOverflow: true,     // prevents blank space if slides < slidesPerView
					breakpoints: {
						576: { slidesPerView: 4,  },
						768: { slidesPerView: 5,  },
						992: { slidesPerView: 4,  },
						1200: { slidesPerView: 5, },
						1400: { slidesPerView: 6, }
					},
					navigation: nextBtn && prevBtn ? {
						nextEl: nextBtn,
						prevEl: prevBtn
					} : undefined
				});

				swiperInstance.update(); // force recalculation
			};

			if (offcanvas) {
				offcanvas.addEventListener('shown.bs.offcanvas', () => {
					setTimeout(() => initSwiper(), 50);
				});
			} else {
				initSwiper();
			}

			// ✅ Recalculate on window resize to avoid right side showing blank
			window.addEventListener('resize', () => {
				initSwiper();
			});

		});

	});


	// Only run the slider code if the element is actually on the page
	document.addEventListener("DOMContentLoaded", function () {

    const slider = document.getElementById('range-slider');

    // Check BOTH element and library
    if (slider && typeof noUiSlider !== "undefined") {

			noUiSlider.create(slider, {
				start: [200, 800],
				connect: true,
				range: {
					min: 0,
					max: 1000
				},
				step: 1,
				tooltips: [true, true],

				// ✅ Add this
				handleAttributes: [
					{ 'aria-label': 'Minimum price' },
					{ 'aria-label': 'Maximum price' }
				],

				format: {
					to: (value) => '$' + Math.round(value),
					from: (value) => value.replace('$', '')
				}
			});

		}

	});

	// Show/Hide Reason Box
	const reasonSelect = document.getElementById('reason-select');
	const otherReasonBox = document.getElementById('other-reason-box');

	if (reasonSelect && otherReasonBox) {
		reasonSelect.addEventListener('change', function () {
			if (this.value === 'others') {
				otherReasonBox.style.display = 'block';
			} else {
				otherReasonBox.style.display = 'none';
			}
		});
	}

})();