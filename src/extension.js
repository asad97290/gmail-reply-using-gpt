"use strict";
import axios from "axios";
// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
  if (!window._gmailjs) {
    return;
  }

  clearInterval(loaderId);
  startExtension(window._gmailjs);
}, 100);

// actual extension-code
function startExtension(gmail) {
  console.log("Extension loading...");
  window.gmail = gmail;

  gmail.observe.on("load", () => {
    let userEmail = gmail.get.user_email();
    let emailData;
    console.log("Hello, " + userEmail + ". This is your extension talking!");

    gmail.observe.on("view_email", (domEmail) => {
      console.log("Looking at email:", domEmail);
      emailData = gmail.new.get.email_data(domEmail);
    });

    gmail.observe.on("compose", (compose) => {
      addCustomButton(emailData);
      console.log("New compose window is opened!", compose);
    });
  });
}

function addCustomButton(emailData) {
  const sendButton = document.querySelector("td.gU.Up");
  if (sendButton) {
    const customButton = document.createElement("button");

    const divHide = document.createElement("div");
    divHide.setAttribute("id", "tHide");
    document.body.appendChild(divHide);

    customButton.innerText = "Reply GPT";

    customButton.classList.add("custom-button");
    customButton.style.marginLeft = "8px";
    customButton.style.padding = "8px 16px";
    customButton.style.fontSize = "14px";
    customButton.style.fontWeight = "bold";
    customButton.style.textAlign = "center";
    customButton.style.border = "none";
    customButton.style.borderRadius = "4px";
    customButton.style.backgroundColor = "#0b57d0";
    customButton.style.color = "#fff";
    customButton.style.cursor = "pointer";

    // Add your custom logic when the button is clicked
    customButton.addEventListener("click", async (e) => {
      e.preventDefault();

      let text = htmlToText(emailData.content_html);
      let myPrompt = document.querySelectorAll('[role="textbox"]')[0].innerText;
      // Your custom code here
      let prompt = `==== Important ==== 
        Reply to previous email from email:${emailData.from.address}, name:${
        emailData.from.name
      }
        with a long and polite email which says:
        ${myPrompt.substring(0, 1000)}
        signed by me email:${emailData.to[0].address}, name:${
        emailData.to[0].name
      }

        ==== end of important ====
        this is previous email for context reference:
        ${text.substring(0, 2000)}
        this is the subject "${emailData.subject}"
        ==== end of reference ====`;


      document.querySelectorAll('[role="textbox"]')[0].innerText =
        "Thinking...";

      try {
        let { data } = await axios.post(
          "https://gpt-backend-tau.vercel.app/api/chat",
          {
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        document.querySelectorAll('[role="textbox"]')[0].innerText =
          data.response[0].message.content;
      } catch (error) {
        document.querySelectorAll('[role="textbox"]')[0].innerText =
          "Error" + error.message;
      }
    });

    sendButton.parentNode.insertBefore(customButton, sendButton.nextSibling);
  }
}

function htmlToText(contentHtml) {
  var htmlCode = contentHtml;
  //get rid of scripts
  htmlCode = htmlCode.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  //Title and list bullets
  htmlCode = htmlCode.replace(/<title>/gi, "<title>META TAG (title): ");
  htmlCode = htmlCode.replace(/<link/gi, "<llink");
  htmlCode = htmlCode.replace(/<\/li><li>/gi, "</li>\n<li>");
  htmlCode = htmlCode.replace(/<li/gi, "\n• <li");
  htmlCode = htmlCode.replace(/<llink/gi, "<link");
  htmlCode = htmlCode.replace(/<\/li>\n/gi, "</li>");

  //description meta tag
  var tempoDom = document.createElement("div");
  tempoDom.innerHTML = htmlCode;
  if (tempoDom.querySelector("[name=description]") !== null) {
    var metaDesc = tempoDom.querySelector("[name=description]").content;
    htmlCode = htmlCode.replace(
      /<\/title>/gi,
      "</title>\n\nMETA TAG (description): " +
        metaDesc +
        "\n\n--------------------------------------------------------------\n\n"
    );
  }

  // //remove tags
  document.getElementById("tHide").innerHTML = htmlCode;
  htmlCode = document.getElementById("tHide").textContent;
  document.getElementById("tHide").style.display = "none";
  //line break shenanigans
  htmlCode = htmlCode.replace(/(\n\r|\n|\r)/gm, "\n");
  htmlCode = htmlCode.replace(/(\n \n)/gm, "\n\n");
  htmlCode = htmlCode.replace(/(\n	\n)/gm, "\n\n");
  htmlCode = htmlCode.replace(/(\n\n\n\n\n\n\n)/gm, "\n\n");
  htmlCode = htmlCode.replace(/(\n\n\n\n\n\n)/gm, "\n\n");
  htmlCode = htmlCode.replace(/(\n\n\n\n\n)/gm, "\n\n");
  htmlCode = htmlCode.replace(/(\n\n\n\n)/gm, "\n\n");
  htmlCode = htmlCode.replace(/(\n\n\n)/gm, "\n\n");
  htmlCode = htmlCode.trim();
  return htmlCode;
}
