"use strict";
let axios = require("axios");
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
        let userEmail = gmail.get.user_email()
        let emailData
        console.log("Hello, " + userEmail + ". This is your extension talking!");
        
        gmail.observe.on("view_email", (domEmail) => {
            console.log("Looking at email:", domEmail);
            emailData = gmail.new.get.email_data(domEmail);
            console.log("emailData",emailData)
        });
        
        gmail.observe.on("compose", (compose) => {
            addCustomButton(emailData,userEmail)
            console.log("New compose window is opened!", compose);
        });
    });
}


 function addCustomButton(emailData,userEmail) {
    
    const sendButton = document.querySelector("td.gU.Up");
    if (sendButton) {

      const customButton = document.createElement("button");
      const divHide = document.createElement("div");
      divHide.setAttribute("id","tHide");
      document.body.appendChild(divHide);


      customButton.innerText = "Reply GPT";

      customButton.classList.add("custom-button");
      customButton.style.marginLeft = '8px';
      customButton.style.padding = '8px 16px';
      customButton.style.fontSize = '14px';
      customButton.style.fontWeight = 'bold';
      customButton.style.textAlign = 'center';
      customButton.style.border = 'none';
      customButton.style.borderRadius = '4px';
      customButton.style.backgroundColor = "#0b57d0";
      customButton.style.color = '#fff';
      customButton.style.cursor = 'pointer';

      // Add your custom logic when the button is clicked
      customButton.addEventListener("click", async(e) => {
        e.preventDefault();
      
        console.log("emailData.content_html",emailData.content_html)
        let text = htmlToText(emailData.content_html)
        // Your custom code here
        let prompt = `Help me to respond to this email: 
        ${text}.
        This is my email address ${emailData.to[0].address} and my name is ${emailData.to[0].name}
        and this is receiver email address ${emailData.from.address} and receiver name is ${emailData.from.name}`
        console.log(prompt)
        document.querySelectorAll('[role="textbox"]')[0].innerText= "Thinking..."
        try{
        let {data} = await axios.post("https://gpt-backend-tau.vercel.app/api/chat",
            { messages: [
                {
                    role:"user",
                    content:prompt
                }
            ]},
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
        );

            console.log("data",data.response[0].message.content)
            document.querySelectorAll('[role="textbox"]')[0].innerText= data.response[0].message.content
        }catch(error){
            console.log(error)
            document.querySelectorAll('[role="textbox"]')[0].innerText= "Error"+error.message

        }

      });

    
      sendButton.parentNode.insertBefore(customButton, sendButton.nextSibling);


    }
}









function htmlToText(contentHtml){
		
	var htmlCode = contentHtml
	//get rid of scripts
	htmlCode = htmlCode.replace (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
	//Title and list bullets
	htmlCode = htmlCode.replace (/<title>/gi, "<title>META TAG (title): ");
	htmlCode = htmlCode.replace (/<link/gi, "<llink");
	htmlCode = htmlCode.replace (/<\/li><li>/gi, "</li>\n<li>");
	htmlCode = htmlCode.replace (/<li/gi, "\n• <li");
	htmlCode = htmlCode.replace (/<llink/gi, "<link");
	htmlCode = htmlCode.replace (/<\/li>\n/gi, "</li>");

	//description meta tag
    var tempoDom = document.createElement('div');
    tempoDom.innerHTML = htmlCode;
    if (tempoDom.querySelector("[name=description]") !== null){
        var metaDesc = tempoDom.querySelector("[name=description]").content;
        htmlCode = htmlCode.replace (/<\/title>/gi, "</title>\n\nMETA TAG (description): "+metaDesc + "\n\n--------------------------------------------------------------\n\n");
    }

	// //remove tags
	document.getElementById("tHide").innerHTML = htmlCode;
	htmlCode = document.getElementById("tHide").textContent;
	document.getElementById("tHide").style.display = "none"; 
	//line break shenanigans
	htmlCode = htmlCode.replace(/(\n\r|\n|\r)/gm,"\n");
	htmlCode = htmlCode.replace(/(\n \n)/gm,"\n\n");
	htmlCode = htmlCode.replace(/(\n	\n)/gm,"\n\n");
	htmlCode = htmlCode.replace(/(\n\n\n\n\n\n\n)/gm,"\n\n");
	htmlCode = htmlCode.replace(/(\n\n\n\n\n\n)/gm,"\n\n");
	htmlCode = htmlCode.replace(/(\n\n\n\n\n)/gm,"\n\n");
	htmlCode = htmlCode.replace(/(\n\n\n\n)/gm,"\n\n");
	htmlCode = htmlCode.replace(/(\n\n\n)/gm,"\n\n");
	htmlCode = htmlCode.trim();
    return htmlCode
}

