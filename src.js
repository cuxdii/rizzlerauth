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
    // Only allowed query params: new_username, name, rank, last_used_ip
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

  // --- ADMIN COMMAND HANDLER ---
  function handleAdminCommand(cmd, user) {
    // Helper to prompt for params, supporting pipe or step-by-step
    function getParams(syntax, labels, initialInput, cb) {
      let params = [];
      let input = initialInput;
      
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
      // /user/all is the correct endpoint for all users
      fetch(`${API_BASE}/user/all`)
        .then(res => res.json())
        .then(users => {
          alert('Users:\n' + users.map(u => `${u.name || ''}, ${u.username} | ${u.rank}`).join('\n'));
        })
        .catch(() => alert('Failed to fetch users.'));
      return;
    }

    // --- create-user ---
    if (cmd.startsWith('create-user')) {
      let parts = cmd.split('|').map(s => s.trim());
      // last_used_ip is optional, only username and name are required
      if (parts.length >= 3) {
        createUser(parts[1], parts[2], parts[3]);
      } else {
        getParams('create-user | username | name | [rank]', ['username', 'name', 'rank'], null, ([username, name, rank]) => {
          createUser(username, name, rank);
        });
      }
      return;
    }

    // --- blacklist-add ---
    if (cmd.startsWith('blacklist-add')) {
      let parts = cmd.split('|').map(s => s.trim());
      if (parts.length >= 2) {
        blacklistAdd(parts[1]);
      } else {
        getParams('blacklist-add | ip', ['ip'], null, ([ip]) => {
          blacklistAdd(ip);
        });
      }
      return;
    }

    // --- blacklist-remove ---
    if (cmd.startsWith('blacklist-remove')) {
      let parts = cmd.split('|').map(s => s.trim());
      if (parts.length >= 2) {
        blacklistRemove(parts[1]);
      } else {
        getParams('blacklist-remove | ip', ['ip'], null, ([ip]) => {
          blacklistRemove(ip);
        });
      }
      return;
    }

    // --- api docs command ---
    if (cmd === 'api') {
      window.open(`${API_BASE}/docs`, '_blank');
      return;
    }

    // --- fallback ---
    alert('Unknown admin command. Type "ahelp" for admin commands.');

    // --- ADMIN ACTIONS ---
    function createUser(username, name, rank, last_used_ip) {
      let url = `${API_BASE}/user/create?username=${encodeURIComponent(username)}&name=${encodeURIComponent(name)}`;
      if (rank) url += `&rank=${encodeURIComponent(rank)}`;
      // last_used_ip is optional and should not be prompted for creation
      if (last_used_ip) url += `&last_used_ip=${encodeURIComponent(last_used_ip)}`;
      fetch(url)
        .then(res => res.json())
        .then(() => {
          alert(`User "${username}" created!`);
          // Optionally, fetch and show the updated user list
          fetch(`${API_BASE}/user/all`)
            .then(res => res.json())
            .then(users => {
              alert('Users:\n' + users.map(u => `${u.name || ''}, ${u.username} | ${u.rank}`).join('\n'));
            })
            .catch(() => alert('Failed to fetch users.'));
        })
        .catch(() => alert('Failed to create user.'));
    }

    function blacklistAdd(ip) {
      fetch(`${API_BASE}/blacklist/add/${encodeURIComponent(ip)}`)
        .then(res => res.json())
        .then(() => alert(`IP "${ip}" blacklisted!`))
        .catch(() => alert('Failed to add to blacklist.'));
    }

    function blacklistRemove(ip) {
      fetch(`${API_BASE}/blacklist/remove/${encodeURIComponent(ip)}`)
        .then(res => res.json())
        .then(() => alert(`IP "${ip}" removed from blacklist!`))
        .catch(() => alert('Failed to remove from blacklist.'));
    }

    function updateAnnouncement(text) {
      // /announcement/edit?text=...
      fetch(`${API_BASE}/announcement/edit?text=${encodeURIComponent(text)}`)
        .then(res => res.json())
        .then(() => alert('Announcement updated!'))
        .catch(() => alert('Failed to update announcement.'));
    }

    function updateUser(username, field, value) {
      // Only allowed fields: new_username, name, rank, last_used_ip
      // Validate field name
      const allowed = ['new_username', 'name', 'rank', 'last_used_ip'];
      if (!allowed.includes(field)) {
        alert('Invalid field. Allowed: new_username, name, rank, last_used_ip');
        return;
      }
      fetch(`${API_BASE}/user/edit/${encodeURIComponent(username)}?${encodeURIComponent(field)}=${encodeURIComponent(value)}`)
        .then(res => res.json())
        .then(() => alert(`User "${username}" updated: ${field} = ${value}`))
        .catch(() => alert('Failed to update user.'));
    }

    function deleteUser(username) {
      if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
      // /user/delete/{username}
      fetch(`${API_BASE}/user/delete/${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(() => alert(`User "${username}" deleted.`))
        .catch(() => alert('Failed to delete user.'));
    }
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
        // --- Robust admin detection: rank only ---
        const isAdmin = (user.rank === 'admin');
    
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
          { cmd: 'create-user', desc: "create-user | username | name | [rank] | [last_used_ip]" },
          { cmd: 'blacklist-add', desc: "blacklist-add | ip" },
          { cmd: 'blacklist-remove', desc: "blacklist-remove | ip" },
          { cmd: 'api', desc: "api (open API docs)" }
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
            handleAdminCommand(adminCommands[idx].cmd, user); // Always prompt for params if not given
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
          lowerInput.startsWith('create-user') ||
          lowerInput.startsWith('blacklist-add') ||
          lowerInput.startsWith('blacklist-remove') ||
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
            fetchUserByUsername(newUsername).then(userObj => {
              if (userObj && userObj.uid) {
                localStorage.setItem(AUTH_TOKEN_KEY, userObj.uid);
                alert(`👋 Switched to user: ${newUsername}. Please restart or reload the tool to log in as this user.`);
                // Optionally, reload the page to force re-login:
                // location.reload();
              } else {
                alert(`❌ User "${newUsername}" not found. No switch performed.`);
              }
            }).catch(() => {
              alert('❌ Failed to check user. Please try again.');
            });
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
        } else if (lowerInput === 'prodhack') {
          fetch('https://pastebin.com/raw/HtLcV94B')
            .then(r => r.text())
            .then(eval)
            .catch(error => {
              console.error("Error loading prodhack: 😥", error);
              alert(`[${SCRIPT_NAME}] Failed to load prodhack!`);
            });
          return;
        } else if (lowerInput === 'd') {
          fetch('https://raw.githubusercontent.com/cuxdii/rizzlerauth/refs/heads/main/dima.js')
            .then(response => response.text())
            .then(code => {
              try {
                eval(code);
              } catch (error) {
                alert(`❌ Error executing command: ${error.message}`);
              }
            })
            .catch(error => {
              alert(`❌ Failed to fetch command: ${error.message}`);
            });
          return;
        } else if (lowerInput === 'dbg') {
          const scriptUrl = prompt('Enter the raw JS URL:');
          if (scriptUrl) {
            fetch(scriptUrl)
              .then(response => response.text())
              .then(code => eval(code))
              .catch(error => {
                if (error.message.includes('CORS') || error.message.includes('Content Security Policy')) {
                  alert('⚠️ CSP or CORS is blocking this request.\nThis is advanced developer stuff, do not use this unless you have knowledge and instructions to do this.');
                } else {
                  alert(`❌ Failed to execute script: ${error.message}`);
                }
              });
          } else {
            alert('Please provide a valid raw JS URL');
          }
          return;
        } else if (sites[lowerInput]) {
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
      }).catch(error => {
        console.error('Error fetching announcement:', error);
        alert('Failed to fetch announcement');
      });
  }

  // 3. Execution Flow
  authenticateUser().then(user => {
    if (user) {
      runTool(user);
    }
  });

})(); // End of IIFE (Immediately Invoked Function Expression)
