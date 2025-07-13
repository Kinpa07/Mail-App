document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    submit_email();
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-single-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

 async function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-single-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  const response = await fetch(`/emails/${mailbox}`);
  const emails = await response.json()
  emails.forEach(email => {
    const email_div = document.createElement('div');
    email_div.dataset.id = email.id;
    email_div.className = 'border border-primary rounded p-3 mt-3';
    email_div.classList.add('email-item');
    if (email.read) {
      email_div.classList.add('bg-light')
    } else{
      email_div.classList.add('bg-secondary', 'text-white');
    }
    email_div.innerHTML = `<strong>${email.subject}</strong> from ${email.sender} at ${email.timestamp}`
    document.querySelector('#emails-view').appendChild(email_div)

    email_div.addEventListener('click', async () => {
      const response = await fetch(`/emails/${email_div.dataset.id}`);
      const email = await response.json();
      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn btn-sm btn-outline-primary mt-2';
      archiveButton.innerText = email.archived ? "Unarchive" : "Archive";
      const replyButton = document.createElement('button');
      replyButton.className = 'btn btn-sm btn-outline-primary mt-2 ml-2';
      replyButton.innerText = 'Reply';
      
      await fetch(`/emails/${email_div.dataset.id}`, {
        method : 'PUT',
        body: JSON.stringify({read : true})
      })
      if (mailbox != 'sent'){
      archiveButton.addEventListener('click', async () => {
      await fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({ archived: !email.archived })
      });
      load_mailbox('inbox');
})};
      replyButton.addEventListener('click', async() =>{
      document.querySelector('#compose-view').style.display = 'block';
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#email-single-view').style.display = 'none';
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`
      document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
      document.querySelector('#compose-body').focus();
      document.querySelector('#compose-body').setSelectionRange(0, 0);
      })
      const single_email = document.createElement('div')

single_email.innerHTML = `
  <div><strong>From:</strong> ${email.sender}</div>
  <div><strong>To:</strong> ${email.recipients.join(', ')}</div>
  <div><strong>Subject:</strong> ${email.subject}</div>
  <div><strong>Timestamp:</strong> ${email.timestamp}</div>
  <hr>
  <pre class="email-body">${email.body}</pre>
`;
      const singleEmailView = document.querySelector('#email-single-view');
      singleEmailView.innerHTML = '';
      singleEmailView.appendChild(single_email);
      singleEmailView.appendChild(archiveButton);
      singleEmailView.appendChild(replyButton);
      singleEmailView.style.display = 'block';
      document.querySelector('#emails-view').style.display = 'none'
      document.querySelector('#compose-view').style.display = 'none'
    })
  });
}

async function submit_email() {
  const recipient = document.querySelector('#compose-recipients').value
  const subject = document.querySelector("#compose-subject").value
  const body = document.querySelector("#compose-body").value

  const response = await fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ recipients: recipient, subject: subject, body: body }),
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    load_mailbox('sent');
  } else {
    const error = await response.json();
    alert(error.error)
  }
};