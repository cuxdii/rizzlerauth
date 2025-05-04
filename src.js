// you smart duck.. you somehow got the code!
// contact me at school for a surprise, otherwise scram..

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
  
    const AUTH_TOKEN_KEY = 'QuickClientAuthUUID'; // Now stores uuid
    const API_BASE = 'https://qcapi.onrender.com';
  
    // Helper: fetch user by username
    function fetchUserByUsername(username) {
      return fetch(`${API_BASE}/user/find?username=${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(users => Array.isArray(users) && users.length > 0 ? users[0] : null);
    }
  
    // Helper: fetch user by uuid
    function fetchUserByUUID(uuid) {
      return fetch(`${API_BASE}/user/find?uid=${encodeURIComponent(uuid)}`)
        .then(res => res.json())
        .then(users => Array.isArray(users) && users.length > 0 ? users[0] : null);
    }
  
    // Helper: get current public IP
    function fetchCurrentIP() {
      return fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
    }
  
    // Helper: update last_used_ip for user
    function updateUserLastIP(username, ip) {
      return fetch(`${API_BASE}/user/edit/${encodeURIComponent(username)}?last_used_ip=${encodeURIComponent(ip)}`)
        .then(res => res.json());
    }
  
    function authenticateUser() {
      const storedUUID = localStorage.getItem(AUTH_TOKEN_KEY);
  
      // Try auto-login with stored UUID
      if (storedUUID) {
        return fetchUserByUUID(storedUUID).then(user => {
          if (user && user.uid) {
            // Check and update last_used_ip if needed
            return fetchCurrentIP().then(currentIP => {
              if (currentIP && user.last_used_ip !== currentIP) {
                updateUserLastIP(user.username, currentIP);
              }
              // Move the alert outside so it doesn't block the promise chain
              return user;
            });
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            return promptLogin();
          }
        });
      } else {
        return promptLogin();
      }
  
      // Prompt for username and check existence in DB
      function promptLogin() {
        const username = prompt(`👋 Hey there! To use ${SCRIPT_NAME}, please enter your username:`)?.trim().toLowerCase();
        if (!username) {
          alert(`[${SCRIPT_NAME}] Authentication failed! 🚫 Please provide a username to use this tool. 😔`);
          return Promise.resolve(null);
        }
        return fetchUserByUsername(username).then(user => {
          if (user && user.uid) {
            localStorage.setItem(AUTH_TOKEN_KEY, user.uid);
            // Check and update last_used_ip if needed
            return fetchCurrentIP().then(currentIP => {
              if (currentIP && user.last_used_ip !== currentIP) {
                updateUserLastIP(user.username, currentIP);
              }
              alert(`🎉 Welcome to ${SCRIPT_NAME}, ${user.name || user.username}! ✨ You're all set!`);
              return user;
            });
          } else {
            alert(`[${SCRIPT_NAME}] Authentication failed! 🚫 User not found.`);
            return null;
          }
        }).catch(error => {
          console.error("Error fetching user: 😥", error);
          alert(`[${SCRIPT_NAME}] Authentication failed! 😢 Please check your connection and try again.`);
          return null;
        });
      }
    }
  
    // Example: fetch user data anywhere by UUID
    function getCurrentUser() {
      const uuid = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!uuid) return Promise.resolve(null);
      return fetchUserByUUID(uuid);
    }
  
    function runTool(user) {
      fetch(`${API_BASE}/announcement`)
        .then(response => response.json())
        .then(data => {
          const announcementText = data.announcement || "";
          let announcementString = '';
          if (announcementText.trim().length > 0) {
      announcementString = `\n📣 ${announcementText.trim()}`;
          }
          // --- Robust admin detection: role or rank only ---
          const isAdmin = (user.role === 'admin' || user.rank === 'admin');
      
          // --- Mobile device detection and warning ---
          const isMobile = /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
          if (isMobile) {
            alert("⚠️ Warning: Using Quick Client on a mobile device is strongly not advised. Most commands will not work properly.");
          }
      
          const adminNote = isAdmin ? "\n🔑 Admin: Type 'ahelp' for admin commands." : "";
          const promptMessage =
            `👋 Welcome, ${user.name || user.username}!  (${SCRIPT_NAME})${adminNote}\n` +
            `────────────────────────────\n` +
            `Type "help" for all commands | ✨ ai [question]: Ask the AI! ✨\n` +
            (announcementString ? `${announcementString}\n` : "") +
            `────────────────────────────\n` +
            `Shortcut or command:`;
      
          const input = prompt(promptMessage);
      
          if (!input) return;
      
          const lowerInput = input.toLowerCase();
      
          const adminCommands = [
            { cmd: 'edit-announcement', desc: "edit-announcement | [new announcement]" },
            { cmd: 'edit-user', desc: "edit-user | username | field | value" },
            { cmd: 'delete-user', desc: "delete-user | username" },
            { cmd: 'list-users', desc: "list-users" },
            { cmd: 'api', desc: "api (open API docs)" } // <-- Added API docs command
          ];
      
          // --- Use isAdmin for all admin checks ---
          if ((lowerInput === 'ahelp' || lowerInput === 'alist') && isAdmin) {
            let msg = "🔒 Admin Commands:\n";
            adminCommands.forEach((c, i) => {
              msg += `${i + 1}. ${c.desc}\n`;
            });
            msg += "You can enter params separated by '|', or enter them one by one.\n";
            msg += "Or type a[number] (e.g. a1) to run a command.";
            alert(msg);
            return;
          }
      
          if (isAdmin && /^a\d+$/.test(lowerInput)) {
            const idx = parseInt(lowerInput.slice(1), 10) - 1;
            if (adminCommands[idx]) {
              handleAdminCommand(adminCommands[idx].cmd, user);
              return;
            } else {
              alert("Unknown admin command number.");
              return;
            }
          }
      
          if (isAdmin && (
            lowerInput.startsWith('edit-announcement') ||
            lowerInput.startsWith('edit-user') ||
            lowerInput.startsWith('delete-user') ||
            lowerInput.startsWith('list-users') ||
            lowerInput === 'api'
          )) {
            handleAdminCommand(lowerInput, user);
            return;
          }
  
          // Accept both "help" and "list" as aliases
          if (lowerInput === 'help' || lowerInput === 'list') {
            let message = "🌟 Shortcuts:\n";
            for (const key in sites) {
              message += `👉 ${key}: ${sites[key]}\n`;
            }
            message += "👉 prodhack: Special Prodigy Tool ✨\n";
            message += "✨ ai [question]: Ask the AI! ✨\n";
            message += "com [domain]: http://[domain].com\n";
            message += "logout: Logout\n";
            message += "switch [username]: Switch user";
            alert(message);
            return;
          } else if (lowerInput === 'logout') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            alert(`👋 Logged out. Run the tool again to log in.`);
            return;
          } else if (lowerInput.startsWith('switch ')) {
            const newUsername = lowerInput.substring(7).trim();
            if (newUsername) {
              localStorage.setItem(AUTH_TOKEN_KEY, newUsername);
              alert(`👋 Switched to user: ${newUsername}. Run the tool again as this user.`);
              return;
            } else {
              alert('⚠️ Provide a username after "switch".');
              return;
            }
          } else if (lowerInput.startsWith('ai ')) {
            const query = input.substring(3).trim();
            if (!query) {
              alert('⚠️ Provide a question after "ai"!');
              return;
            }
            fetch(`https://qcapi.onrender.com/ai?p=${encodeURIComponent(query)}`)
              .then(response => response.json())
              .then(data => {
                const aiResponse = data.r || data.response || data.message || 'No response received';
                alert(`🤖 AI Response:\n${aiResponse.trim()}`);
              })
              .catch(error => {
                console.error("Error getting AI response: 😥", error);
                alert('❌ Failed to get AI response! Check your connection.');
              });
            return;
          }
  
          if (sites[lowerInput]) {
            if (lowerInput === 'prodhack') {
              const version = prompt('✨ Choose version (v1 or v2):');
              if (version === 'v1') {
                fetch('https://pastebin.com/raw/HtLcV94B')
                  .then(r => r.text())
                  .then(eval)
                  .catch(error => {
                    console.error("Error loading v1: 😥", error);
                    alert(`[${SCRIPT_NAME}] Failed to load v1!`);
                  });
              } else if (version === 'v2') {
                void function(){(function(){
                  const scriptUrl='https://raw.githubusercontent.com/DragonProdHax/PXI/main/PXI%20Fusion';
                  fetch(scriptUrl)
                    .then(a => a.text())
                    .then(code => {eval(code)})
                    .catch(a => {
                      console.error('Failed to load v2: 😥', a);
                      alert(`[${SCRIPT_NAME}] Failed to load v2!`);
                    });
                })()}();
              } else {
                alert('⚠️ Choose either v1 or v2!');
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
              alert('⚠️ Provide a domain after "com".');
            }
          } else {
            alert('🤔 Shortcut not found. Type "help" to see options!');
          }
        })
        .catch(error => {
          console.error("Error fetching announcements: 😥", error);
          const input = prompt(
            `✨ Welcome to ${SCRIPT_NAME}! ✨\n────────────────────────────\nType "help" for all commands | ✨ ai [question]: Ask the AI! ✨\n────────────────────────────\nShortcut or command:\n\nFailed to load announcements.`
          );
          if (!input) return;
          const lowerInput = input.toLowerCase();
          if (lowerInput === 'help' || lowerInput === 'list') {
            let message = "🌟 Shortcuts:\n";
            for (const key in sites) {
              message += `👉 ${key}: ${sites[key]}\n`;
            }
            message += "👉 prodhack: Special Prodigy Tool ✨\n";
            message += "✨ ai [question]: Ask the AI! ✨\n";
            message += "com [domain]: http://[domain].com\n";
            message += "logout: Logout\n";
            message += "switch [username]: Switch user";
            alert(message);
            return;
          } else if (lowerInput.startsWith('ai ')) {
            const query = input.substring(3).trim();
            if (!query) {
              alert('⚠️ Provide a question after "ai"!');
              return;
            }
            fetch(`https://qcapi.onrender.com/ai?p=${encodeURIComponent(query)}`)
              .then(response => response.json())
              .then(data => {
                const aiResponse = data.r || data.response || data.message || 'No response received';
                alert(`🤖 AI Response:\n${aiResponse.trim()}`);
              })
              .catch(error => {
                console.error("Error getting AI response: 😥", error);
                alert('❌ Failed to get AI response! Check your connection.');
              });
            return;
          }
          if (sites[lowerInput]) {
            window.open(sites[lowerInput], '_blank');
          } else if (lowerInput.startsWith('com ')) {
            const domain = lowerInput.substring(4).trim();
            if (domain) {
              const url = `http://${domain}.com`;
              window.open(url, '_blank');
            } else {
              alert('⚠️ Provide a domain after "com".');
            }
          } else {
            alert('🤔 Shortcut not found. Type "help" to see options!');
          }
        });
    }
  
    // 3.  Execution Flow
    authenticateUser().then(user => {
      if (user) {
        runTool(user);
      }
    });

    // --- ADMIN COMMAND HANDLER ---
    function handleAdminCommand(cmd, user) {
      // Helper to prompt for params, supporting pipe or step-by-step
      function getParams(syntax, labels, initialInput, cb) {
        let params = [];
        let input = initialInput;
        let step = 0;
        function next() {
          if (input && input.includes('|')) {
            params = input.split('|').map(s => s.trim());
            if (params.length === labels.length) return cb(params);
            // If not enough params, continue step-by-step
            input = null;
          }
          if (params.length < labels.length) {
            const missing = labels.slice(params.length).join(' | ');
            input = prompt(
              `Admin Command Syntax: ${syntax}\n` +
              `Enter: ${missing}\n` +
              `(You can enter all as: ${missing}, separated by '|')`
            );
            if (!input) return;
            if (input.includes('|')) {
              let more = input.split('|').map(s => s.trim());
              params = params.concat(more);
              if (params.length >= labels.length) return cb(params.slice(0, labels.length));
            } else {
              params.push(input.trim());
            }
            next();
          } else {
            cb(params.slice(0, labels.length));
          }
        }
        next();
      }
  
      // --- edit-announcement ---
      if (cmd.startsWith('edit-announcement')) {
        let parts = cmd.split('|').map(s => s.trim());
        if (parts.length >= 2) {
          updateAnnouncement(parts[1]);
        } else {
          getParams('edit-announcement | [new announcement]', ['new announcement'], null, ([announcement]) => {
            updateAnnouncement(announcement);
          });
        }
        return;
      }
  
      // --- edit-user ---
      if (cmd.startsWith('edit-user')) {
        let parts = cmd.split('|').map(s => s.trim());
        if (parts.length >= 4) {
          updateUser(parts[1], parts[2], parts[3]);
        } else {
          getParams('edit-user | username | field | value', ['username', 'field', 'value'], null, ([username, field, value]) => {
            updateUser(username, field, value);
          });
        }
        return;
      }
  
      // --- delete-user ---
      if (cmd.startsWith('delete-user')) {
        let parts = cmd.split('|').map(s => s.trim());
        if (parts.length >= 2) {
          deleteUser(parts[1]);
        } else {
          getParams('delete-user | username', ['username'], null, ([username]) => {
            deleteUser(username);
          });
        }
        return;
      }
  
      // --- list-users ---
      if (cmd.startsWith('list-users')) {
        fetch(`${API_BASE}/user/list`)
          .then(res => res.json())
          .then(users => {
            alert('Users:\n' + users.map(u => `${u.username} (${u.role})`).join('\n'));
          })
          .catch(() => alert('Failed to fetch users.'));
        return;
      }
  
      // --- fallback ---
      alert('Unknown admin command. Type "ahelp" for admin commands.');
  
      // --- ADMIN ACTIONS ---
      function updateAnnouncement(text) {
        // Use correct GET endpoint to update announcement
        fetch(`${API_BASE}/announcement/edit?text=${encodeURIComponent(text)}`)
          .then(res => res.json())
          .then(() => alert('Announcement updated!'))
          .catch(() => alert('Failed to update announcement.'));
      }

      function updateUser(username, field, value) {
        // Use GET request to update user
        fetch(`${API_BASE}/user/edit/${encodeURIComponent(username)}?${encodeURIComponent(field)}=${encodeURIComponent(value)}`)
          .then(res => res.json())
          .then(() => alert(`User "${username}" updated: ${field} = ${value}`))
          .catch(() => alert('Failed to update user.'));
      }

      function deleteUser(username) {
        if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
        // Use GET request to delete user
        fetch(`${API_BASE}/user/delete/${encodeURIComponent(username)}`)
          .then(res => res.json())
          .then(() => alert(`User "${username}" deleted.`))
          .catch(() => alert('Failed to delete user.'));
      }
      
      // --- api docs command ---
      if (cmd === 'api') {
        window.open(`${API_BASE}/docs`, '_blank');
        return;
      }
    }
})();
