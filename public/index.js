// const endpointTestParagraph = document.getElementById("api-endpoint-test");

// // I recommend to try out axios as library, which is easier to use
// // than the native fetch API we're using here.
// fetch("/api/ping")
//   .then((res) => {
//     if (!res.ok) {
//       const err = new Error("Not a 2xx response");
//       err.response = res;
//       throw err;
//     }
//     res.text().then((text) => {
//       endpointTestParagraph.innerText = text;
//       console.log(`got data: ${text}`);
//     });
//   })
//   .catch((err) => {
//     endpointTestParagraph.innerText = err;
//     console.error(err);
//   });

let answered;

const languageSelector = document.getElementById("language-selector");
let selectedLanguage = "en";

const form = document.querySelector("#answer");
const answer = form.querySelector('[name="answer"]');

const response_loading = document.querySelector("#response-loading");
const response_field = document.querySelector("#response-field");
const response_time = document.querySelector("#response-time");

document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("answered") !== null) {
    answered = localStorage.getItem("answered");
    form.remove();
    answer.remove();
    languageSelector.remove();
  } else {
    answered = false;
  }

  if (
    localStorage.getItem("response_answer") !== null &&
    localStorage.getItem("answer_time") !== null
  ) {
    let submitted;

    if (localStorage.getItem("language") !== null) {
      selectedLanguage = localStorage.getItem("language");

      if (selectedLanguage === "en") {
        submitted = "Submitted";
      } else {
        submitted = "Eingereicht";
      }
    }

    response_field.textContent = localStorage.getItem("response_answer");
    response_time.textContent =
      submitted + ": " + localStorage.getItem("answer_time");
  }

  const translations = {
    de: {
      title: "Hey du! <br/>Entdecke einen versteckten Schatz in Berlin!",
      subtitle:
        "Schreibe einen Geheimtipp (einen verborgenen Schatz) in Berlin hin, den du besonders magst und der vielleicht noch nicht vielen bekannt ist, und du bekommst im Gegenzug einen Geheimtipp, einen verborgenen Schatz zurück! Wenn du möchtest, kannst du in Klammern hinzufügen, worum es bei diesem Ort geht.",
      placeholder: "Antwort...",
      button: "Senden",
    },
    en: {
      title: "Hey you! <br/>Discover a hidden gem in Berlin!",
      subtitle:
        "Put in a secret place (the hidden gem) in Berlin that you like a lot that may not be known by a lot of people and you get a secret place, a hidden gem in return! You can put in brackets, what the place is about if you want.",
      placeholder: "Answer...",
      button: "Submit",
    },
  };

  languageSelector.addEventListener("click", function () {
    selectedLanguage = languageSelector.value;
    localStorage.setItem("language", selectedLanguage);

    changeLanguage();
  });

  function changeLanguage() {
    const translation = translations[selectedLanguage];

    document.getElementById("response-field").innerHTML = translation.title;
    document.getElementById("response-time").textContent = translation.subtitle;

    document.getElementById("answer-input").placeholder =
      translation.placeholder;
    document.getElementById("answer-button").textContent = translation.button;

    if (languageSelector.value === "de") {
      languageSelector.value = "en";
    } else {
      languageSelector.value = "de";
    }

    languageSelector.textContent = languageSelector.value;
  }

  if (localStorage.getItem("language") !== null) {
    selectedLanguage = localStorage.getItem("language");

    if (answered === false) {
      changeLanguage();
    }
  }
});

console.log(answer);

async function sendData(data) {
  try {
    console.log(data);

    const response = await fetch("/api/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // this is required
      },
      // Set the FormData instance as the request body
      body: JSON.stringify({ data }),
    });

    console.log(await response.json());
  } catch (e) {
    console.error(e);
  }
}

async function recieveData() {
  try {
    const response = await fetch("/api/response", {
      method: "GET",
    });

    const result = await response.json();

    const response_answer = result.response.answer;
    const answer_time = result.response.time;

    console.log(response_answer, answer_time);

    // Add to local storage
    localStorage.setItem("response_answer", response_answer);
    localStorage.setItem("answer_time", answer_time);

    setTimeout(() => {
      let submitted;

      if (selectedLanguage === "en") {
        submitted = "Submitted";
      } else {
        submitted = "Eingereicht";
      }

      response_time.innerHTML = submitted + ": " + answer_time;

      setTimeout(() => {
        response_field.innerHTML = response_answer;
      }, 500);
    }, 500);
  } catch (e) {
    console.error(e);
  }
}

function insertResponse() {
  if (selectedLanguage === "en") {
    response_loading.innerHTML =
      "Thanks for contributing your Part! This is the hidden gem you should check out! I guess you can close this page now, after making a screenshot.";
  } else {
    response_loading.innerHTML =
      "Danke für deinen Beitrag! Das ist ein echter Geheimtipp, den du dir unbedingt ansehen solltest! Ich denke, du kannst diese Seite jetzt schließen, nachdem du einen Screenshot gemacht hast.";
  }

  response_time.innerHTML = "";
  response_field.innerHTML = "";

  localStorage.setItem("answered", answered);

  recieveData();
}

// Take over form submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  answered = true;

  const data = answer.value;
  sendData(data);

  form.remove();
  languageSelector.remove();

  insertResponse();
});

const IMAGE_WIDTH = 100;
const MARGIN = 20; // Minimum margin from edges

// Random position function
function getRandomPosition() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const maxX = Math.max(0, viewportWidth - IMAGE_WIDTH - MARGIN);
  const maxY = Math.max(0, viewportHeight - IMAGE_WIDTH - MARGIN);

  const randomX = (Math.floor(Math.random() * (maxX - MARGIN + 1)) + MARGIN);
  const randomY = (Math.floor(Math.random() * (maxY - MARGIN + 1)) + MARGIN);

  return { x: randomX, y: randomY };
}

// Position all images randomly on load
document.querySelectorAll(".draggable").forEach((img) => {
  const pos = getRandomPosition();
  img.style.left = pos.x + "px";
  img.style.top = pos.y + "px";
});

let active = null;
let offset = { x: 0, y: 0 };

function onPointerDown(e) {
  const el = e.currentTarget;

  e.preventDefault();

  active = el;
  const rect = el.getBoundingClientRect();

  // Calculate offset relative to the viewport
  offset.x = e.clientX - rect.left;
  offset.y = e.clientY - rect.top;

  active.classList.add("dragging");
  active.style.zIndex = 1000;
  active.setPointerCapture(e.pointerId);

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(e) {
  if (!active) return;

  e.preventDefault();

  const newX = e.clientX - offset.x;
  const newY = e.clientY - offset.y;

  const rect = active.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Clamp to viewport bounds (fixed position stays relative to viewport)
  const clampedX = Math.max(0, Math.min(newX, viewportWidth - width));
  const clampedY = Math.max(0, Math.min(newY, viewportHeight - height));

  active.style.left = clampedX + "px";
  active.style.top = clampedY + "px";
}

function onPointerUp(e) {
  if (!active) return;

  active.classList.remove("dragging");
  active = null;

  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

document.querySelectorAll(".draggable").forEach((img) => {
  img.addEventListener("pointerdown", onPointerDown, { passive: false });
});
