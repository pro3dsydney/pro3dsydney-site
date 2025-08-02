document.getElementById("uploadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const responseText = document.getElementById("response");

  try {
    fetch('https://pro3dsydney-backend.onrender.com/upload', {
      method: 'POST',
      body: formData
    })


    const data = await res.json();

    if (data.success) {
      responseText.textContent = `Uploaded successfully. Inquiry #${data.id}`;
      form.reset();
    } else {
      responseText.textContent = "Upload failed. Please try again.";
    }
  } catch (err) {
    console.error(err);
    responseText.textContent = "Could not connect to server.";
  }
});

// Popup logic
setTimeout(() => {
  document.getElementById("popup").classList.remove("hidden");
}, 15000); // Show after 15 seconds

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

function scrollToForm() {
  document.querySelector(".quote-form").scrollIntoView({ behavior: "smooth" });
  closePopup();
}
