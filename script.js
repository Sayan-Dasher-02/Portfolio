const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const themeToggle = document.querySelector(".theme-toggle");
const typedText = document.querySelector(".typed-text");
const scrollProgressBar = document.querySelector(".scroll-progress span");
const metricNumbers = document.querySelectorAll(".metric-number");
const pageSections = document.querySelectorAll("main section[id]");
const skillMeters = document.querySelectorAll(".skill-meter");
const projectCards = document.querySelectorAll(".project-card");
const backToTopButton = document.querySelector(".back-to-top");
const pageLoader = document.getElementById("page-loader");
const loaderText = document.getElementById("loader-text");
const contactModalTrigger = document.querySelector(".contact-modal-trigger");
const contactModal = document.getElementById("contact-modal");
const modalPanel = document.querySelector(".modal-panel");
const modalCloseControls = document.querySelectorAll("[data-modal-close]");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const firstContactField = document.getElementById("sender-email");
const year = document.getElementById("current-year");
const systemColorScheme = window.matchMedia("(prefers-color-scheme: dark)");
let lastFocusedElement = null;

year.textContent = new Date().getFullYear();
document.body.classList.add("loading");

function readStoredTheme() {
  try {
    return localStorage.getItem("portfolio-theme");
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem("portfolio-theme", theme);
  } catch (error) {
    // The visual theme still changes even if storage is unavailable.
  }
}

function preferredTheme() {
  return readStoredTheme() || (systemColorScheme.matches ? "dark" : "light");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

applyTheme(preferredTheme());

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  });
});

function openContactModal() {
  if (!contactModal) return;

  lastFocusedElement = document.activeElement;
  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  formStatus.textContent = "";

  window.setTimeout(() => {
    firstContactField.focus();
  }, 80);
}

function closeContactModal() {
  if (!contactModal) return;

  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  formStatus.textContent = "";

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function trapModalFocus(event) {
  if (!contactModal?.classList.contains("is-open") || event.key !== "Tab") return;

  const focusableElements = modalPanel.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement || !lastElement) return;

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

contactModalTrigger.addEventListener("click", openContactModal);

modalCloseControls.forEach((control) => {
  control.addEventListener("click", closeContactModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactModal?.classList.contains("is-open")) {
    closeContactModal();
  }

  trapModalFocus(event);
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) return;

  const formData = new FormData(contactForm);
  const senderEmail = String(formData.get("email") || "").trim();
  const senderPhone = String(formData.get("Phone Number") || "").trim();
  const senderMessage = String(formData.get("Message") || "").trim();
  const payload = {
    _subject: "New portfolio contact message",
    _template: "table",
    _captcha: "false",
    _replyto: senderEmail,
    "Sender Email": senderEmail,
    "Phone Number": senderPhone,
    Message: senderMessage,
    "Full Message": [
      `Sender Email: ${senderEmail}`,
      `Phone Number: ${senderPhone}`,
      "",
      "Message:",
      senderMessage
    ].join("\n")
  };
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const serviceUrl = contactForm.dataset.serviceUrl;

  formStatus.classList.remove("is-error");
  formStatus.textContent = "Sending your message...";
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  fetch(serviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Message could not be sent.");
      }

      return response.json();
    })
    .then(() => {
      formStatus.textContent = "Message sent successfully. Thank you!";
      contactForm.reset();
    })
    .catch(() => {
      formStatus.classList.add("is-error");
      formStatus.textContent = "Message could not be sent. Please try again after opening the site through a local server or hosting it online.";
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = "Send Message";
    });
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);
  saveTheme(nextTheme);
  startAnimation();
});

systemColorScheme.addEventListener("change", () => {
  if (!readStoredTheme()) {
    applyTheme(preferredTheme());
    startAnimation();
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let width = 0;
let height = 0;
let particles = [];
let animationFrame = null;
let typingTimeout = null;
let loaderTextInterval = null;
let metricsHaveAnimated = false;
let scrollTicking = false;

function themePalette() {
  const isDark = document.documentElement.dataset.theme === "dark";

  return isDark
    ? {
        background: "#101211",
        grid: "rgba(86, 194, 188, 0.065)",
        particle: "rgba(86, 194, 188, 0.25)",
        accent: "rgba(255, 138, 115, 0.38)",
        link: "246, 239, 231"
      }
    : {
        background: "#f7f9fc",
        grid: "rgba(0, 109, 119, 0.055)",
        particle: "rgba(0, 109, 119, 0.22)",
        accent: "rgba(215, 90, 74, 0.38)",
        link: "23, 25, 29"
      };
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles();
}

function createParticles() {
  const density = width < 680 ? 0.00008 : 0.00013;
  const total = Math.max(42, Math.min(110, Math.floor(width * height * density)));

  particles = Array.from({ length: total }, (_, index) => {
    const direction = index % 2 === 0 ? 1 : -1;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.8,
      speedX: (Math.random() * 0.36 + 0.12) * direction,
      speedY: Math.random() * 0.28 - 0.14,
      phase: Math.random() * Math.PI * 2,
      accent: index % 9 === 0
    };
  });
}

function drawBackground() {
  const palette = themePalette();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const gridSize = width < 680 ? 54 : 72;
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;

  for (let x = 0; x < width + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawParticles(time) {
  const palette = themePalette();
  const linkDistance = width < 680 ? 86 : 118;

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    const pulse = Math.sin(time * 0.0015 + particle.phase) * 0.45;

    particle.x += particle.speedX;
    particle.y += particle.speedY + pulse * 0.02;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, Math.max(0.6, particle.radius + pulse), 0, Math.PI * 2);
    ctx.fillStyle = particle.accent ? palette.accent : palette.particle;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j += 1) {
      const other = particles[j];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);

      if (distance < linkDistance) {
        const opacity = (1 - distance / linkDistance) * 0.16;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = `rgba(${palette.link}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function animate(time = 0) {
  drawBackground();

  if (!prefersReducedMotion.matches) {
    drawParticles(time);
    animationFrame = requestAnimationFrame(animate);
  }
}

function startAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  drawBackground();

  if (!prefersReducedMotion.matches) {
    animationFrame = requestAnimationFrame(animate);
  }
}

function startTypingEffect() {
  if (!typedText) return;

  const phrases = typedText.dataset.typedItems
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!phrases.length) return;

  if (prefersReducedMotion.matches) {
    typedText.textContent = phrases.join(" | ");
    return;
  }

  let phraseIndex = 0;
  let letterIndex = 0;
  let isDeleting = false;

  function type() {
    const phrase = phrases[phraseIndex];
    typedText.textContent = phrase.slice(0, letterIndex);

    if (!isDeleting && letterIndex < phrase.length) {
      letterIndex += 1;
      typingTimeout = window.setTimeout(type, 70);
      return;
    }

    if (!isDeleting && letterIndex === phrase.length) {
      isDeleting = true;
      typingTimeout = window.setTimeout(type, 1300);
      return;
    }

    if (isDeleting && letterIndex > 0) {
      letterIndex -= 1;
      typingTimeout = window.setTimeout(type, 36);
      return;
    }

    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    typingTimeout = window.setTimeout(type, 240);
  }

  type();
}

function updateScrollProgress() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

  scrollProgressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  backToTopButton.classList.toggle("is-visible", window.scrollY > 520);
}

function updateActiveNavigation() {
  let activeId = "home";
  const activationLine = window.innerHeight * 0.38;

  pageSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationLine) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
  });
}

function handleScroll() {
  if (scrollTicking) return;

  scrollTicking = true;
  window.requestAnimationFrame(() => {
    updateScrollProgress();
    updateActiveNavigation();
    scrollTicking = false;
  });
}

function animateMetricCounters() {
  if (metricsHaveAnimated) return;

  metricsHaveAnimated = true;

  metricNumbers.forEach((metric) => {
    const target = Number(metric.dataset.count || "0");
    const suffix = metric.dataset.suffix || "";

    if (prefersReducedMotion.matches) {
      metric.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    function updateCounter(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);

      metric.textContent = `${value}${suffix}`;

      if (progress < 1) {
        window.requestAnimationFrame(updateCounter);
      }
    }

    window.requestAnimationFrame(updateCounter);
  });
}

function setupMetricObserver() {
  if (!metricNumbers.length) return;

  const metricStrip = document.querySelector(".metric-strip");

  if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
    animateMetricCounters();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        animateMetricCounters();
        observer.disconnect();
      }
    },
    { threshold: 0.45 }
  );

  observer.observe(metricStrip);
}

function setupScrollReveals() {
  const revealElements = document.querySelectorAll(
    ".section-heading, .about-layout, .skill-card, .education-card, .project-card, .certificate-item, .contact-copy, .contact-panel"
  );

  if (!revealElements.length) return;

  revealElements.forEach((element) => {
    element.classList.add("reveal");
  });

  if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  document.body.classList.add("reveal-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(element);
  });
}

function setupSkillMeters() {
  if (!skillMeters.length) return;

  skillMeters.forEach((meter) => {
    meter.style.setProperty("--level", `${meter.dataset.level || 0}%`);
  });

  if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
    skillMeters.forEach((meter) => meter.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.55 }
  );

  skillMeters.forEach((meter) => observer.observe(meter));
}

function setupProjectTilt() {
  if (!projectCards.length || prefersReducedMotion.matches) return;

  projectCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

backToTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
});

function hidePageLoader() {
  if (!pageLoader) return;

  const delay = prefersReducedMotion.matches ? 120 : 850;

  window.setTimeout(() => {
    if (loaderTextInterval) {
      window.clearInterval(loaderTextInterval);
    }

    pageLoader.classList.add("is-hidden");
    document.body.classList.remove("loading");
  }, delay);
}

function startLoaderText() {
  if (!loaderText || prefersReducedMotion.matches) return;

  const messages = ["Preparing interface", "Loading projects", "Setting up profile", "Almost ready"];
  let index = 0;

  loaderText.textContent = messages[index];

  loaderTextInterval = window.setInterval(() => {
    index = (index + 1) % messages.length;
    loaderText.textContent = messages[index];
  }, 520);
}

prefersReducedMotion.addEventListener("change", () => {
  if (typingTimeout) {
    window.clearTimeout(typingTimeout);
  }

  startTypingEffect();
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", hidePageLoader);
prefersReducedMotion.addEventListener("change", startAnimation);

resizeCanvas();
startAnimation();
startTypingEffect();
startLoaderText();
setupMetricObserver();
setupScrollReveals();
setupSkillMeters();
setupProjectTilt();
updateScrollProgress();
updateActiveNavigation();

if (document.readyState === "complete") {
  hidePageLoader();
}
