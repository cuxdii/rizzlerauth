(function() {
    const SCRIPT_NAME = "⚡Quick Client";
    const sites = {
      'study': 'https://www.studyladder.com',
      'con': 'https://connect.det.wa.edu.au',
      'yt': 'https://www.youtube.com',
      'gh': 'https://github.com',
      'mdn': 'https://developer.mozilla.org',
      'chat': 'https://hack.chat/?rpschat',
      'prod': 'https://sso.prodigygame.com/game/login?rid=90238d3b-439f-4419-9af4-f82450b4903c',
      'bp': 'https://wa.bpth.app'
    };
  
    const AUTH_TOKEN_KEY = 'QuickClientAuth';
    const ALLOWED_USERS_URL = 'https://raw.githubusercontent.com/cuxdii/rizzlerauth/refs/heads/main/loader';
    const ANNOUNCEMENTS_URL = 'https://raw.githubusercontent.com/cuxdii/rizzlerauth/refs/heads/main/anc';
  
    function authenticateUser() {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  
      if (storedToken) {
        return fetch(ALLOWED_USERS_URL)
          .then(response => response.text())
          .then(allowedUsersText => {
            const allowedUsers = allowedUsersText.split('\n').map(user => user.trim().toLowerCase());
            if (allowedUsers.includes(storedToken.toLowerCase())) {
              return true;
            } else {
              localStorage.removeItem(AUTH_TOKEN_KEY);
              return false;
            }
          })
          .catch(error => {
            console.error("Error fetching allowed users: 😥", error);
            alert(`[${SCRIPT_NAME}] Authentication failed! 😢 Please check your connection and try again.`);
            return false;
          });
      }
  
      const username = prompt(`👋 Hey there! To use ${SCRIPT_NAME}, please enter your username:`);
  
      if (username) {
        return fetch(ALLOWED_USERS_URL)
          .then(response => response.text())
          .then(allowedUsersText => {
            const allowedUsers = allowedUsersText.split('\n').map(user => user.trim().toLowerCase());
            if (allowedUsers.includes(username.toLowerCase())) {
              localStorage.setItem(AUTH_TOKEN_KEY, username);
              alert(`🎉 Welcome to ${SCRIPT_NAME}, ${username}! ✨ You're all set! Just run this code again in the same tab to use the tool without re-authenticating. 🚀`);
              return true;
            } else {
              alert(`[${SCRIPT_NAME}] Authentication failed! 🚫 You are not authorized to use this tool. 😔`);
              return false;
            }
          })
          .catch(error => {
            console.error("Error fetching allowed users: 😥", error);
            alert(`[${SCRIPT_NAME}] Authentication failed! 😢 Please check your connection and try again.`);
            return false;
          });
      } else {
        alert(`[${SCRIPT_NAME}] Authentication failed! 🚫 Please provide a username to use this tool. 😔`);
        return Promise.resolve(false);
      }
    }
  
    function runTool() {
      fetch(ANNOUNCEMENTS_URL)
        .then(response => response.text())
        .then(announcementsText => {
          const announcements = announcementsText.split('\n').filter(Boolean).map(s => s.trim());
          let announcementString = '';
          if (announcements.length > 0) {
            announcementString = `\n\n📣 Important Announcements for ${SCRIPT_NAME}! 📣\n\n${announcements.join('\n\n')}`;
          }
          const input = prompt(`✨ Welcome to ${SCRIPT_NAME}! ✨
  Enter a shortcut (e.g., study, con, chat, prod, prodhack, com youtube),
  "logout", "switch [username]", or type "list" to see options:${announcementString}`);
  
          if (!input) return;
  
          const lowerInput = input.toLowerCase();
  
          if (lowerInput === 'list') {
            let message = "🌟 Available Shortcuts: 🌟\n";
            for (const key in sites) {
              message += `👉 ${key}: ${sites[key]}\n`;
            }
            message += "👉 prodhack: Special Prodigy Tool ✨\n";
            message += "com [domain]:  Go to http://[domain].com\n";
            message += "logout: Logout from the current user.\n";
            message += "switch [username]: Switch to another user.";
            alert(message);
            return;
          } else if (lowerInput === 'logout') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            alert(`👋 You have been logged out. Please run the tool again to log in.`);
            return;
          } else if (lowerInput.startsWith('switch ')) {
            const newUsername = lowerInput.substring(7).trim();
            if (newUsername) {
              localStorage.setItem(AUTH_TOKEN_KEY, newUsername);
              alert(`👋 Switched to user: ${newUsername}. Please run the tool again to use it as this user.`);
              return;
            } else {
              alert('⚠️  Please provide a username after "switch".');
              return;
            }
          }
  
          if (sites[lowerInput]) {
            if (lowerInput === 'prodhack') {
              const version = prompt('✨ Choose your version (v1 or v2)! 🎮');
              if (version === 'v1') {
                fetch('https://pastebin.com/raw/HtLcV94B')
                  .then(r => r.text())
                  .then(eval)
                  .catch(error => {
                    console.error("Error loading v1: 😥", error);
                    alert(`[${SCRIPT_NAME}] Failed to load v1! 😢 Please check your connection and try again.`);
                  });
              } else if (version === 'v2') {
                void function(){(function(){
                  const scriptUrl='https://raw.githubusercontent.com/DragonProdHax/PXI/main/PXI%20Fusion';
                  fetch(scriptUrl)
                    .then(a => a.text())
                    .then(code => {eval(code)})
                    .catch(a => {
                      console.error('Failed to load v2: 😥', a);
                      alert(`[${SCRIPT_NAME}] Failed to load v2! 😢 Please check your connection and try again.`);
                    });
                })()}();
              } else {
                alert('⚠️ Oopsie! Please choose either v1 or v2! 🤔');
              }
            } else {
              window.open(sites[lowerInput], '_blank');
            }
          } else if (lowerInput.startsWith('com ')) {
            const domain = lowerInput.substring(4).trim();
            if (domain) {
              const url = `http://${domain}.com`;
              window.open(url, '_blank');
            } else {
              alert('⚠️  Please provide a domain name after "com".');
            }
          } else {
            alert('🤔 Shortcut not found. Type "list" to see available shortcuts! 🧐');
          }
        })
        .catch(error => {
          console.error("Error fetching announcements: 😥", error);
          const input = prompt(`✨ Welcome to ${SCRIPT_NAME}! ✨
  Enter a shortcut (e.g., study, con, chat, prod, prodhack, com youtube), "logout", "switch [username]", or type "list" to see options:\n\nFailed to load announcements. 😢 Please check your connection.`);
  
          if (!input) return;
  
          const lowerInput = input.toLowerCase();
  
           if (lowerInput === 'list') {
            let message = "🌟 Available Shortcuts: 🌟\n";
            for (const key in sites) {
              message += `👉 ${key}: ${sites[key]}\n`;
            }
            message += "com [domain]:  Go to http://[domain].com\n";
            message += "logout: Logout from the current user.\n";
            message += "switch [username]: Switch to another user.";
            alert(message);
            return;
          } else if (lowerInput === 'logout') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            alert(`👋 You have been logged out. Please run the tool again to log in.`);
            return;
          } else if (lowerInput.startsWith('switch ')) {
            const newUsername = lowerInput.substring(7).trim();
            if (newUsername) {
              localStorage.setItem(AUTH_TOKEN_KEY, newUsername);
              alert(`👋 Switched to user: ${newUsername}. Please run the tool again to use it as this user.`);
              return;
            } else {
              alert('⚠️  Please provide a username after "switch".');
              return;
            }
          }
  
          if (sites[lowerInput]) {
            window.open(sites[lowerInput], '_blank');
          } else if (lowerInput.startsWith('com ')) {
            const domain = lowerInput.substring(4).trim();
            if (domain) {
              const url = `http://${domain}.com`;
              window.open(url, '_blank');
            } else {
              alert('⚠️  Please provide a domain name after "com".');
            }
          } else {
            alert('🤔 Shortcut not found. Type "list" to see available shortcuts! 🧐');
          }
        });
    }
  
    // 3.  Execution Flow
    authenticateUser().then(isAuthenticated => {
      if (isAuthenticated) {
        runTool();
      }
    });
  })();
