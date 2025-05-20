# 🛠️ Troubleshooting

## 🔄 Updating WSL IP Address  
*(If you can’t connect to the server, try this)*

On rare occasions, WSL will change its IP address — breaking authentication and making it so you can’t connect to your server. This can happen due to:

- Improper shutdowns  
- Windows Updates affecting WSL  
- Manually shutting down WSL from PowerShell  

You might not even realize the IP changed — so if auth is failing or the server isn’t reachable, this is worth checking.

---

## 📍 Steps to Update the IP Address

### 1. Update Docker Environment Variables

Open your `docker-compose.yml` and look for these two lines:

```yaml
- GRIST_OIDC_SP_HOST=http://172.29.155.212:8484
- GRIST_OIDC_IDP_ISSUER=http://172.29.155.212:8080/realms/mspi
```

Replace the IP (`172.29.155.212`) with your new WSL IP address.

---

### 2. Update Keycloak Configuration

Once your Docker containers are up and running:

1. Go to [http://localhost:8080](http://localhost:8080)  
2. Log in with your **admin credentials**
3. Select the appropriate **Realm** from the dropdown (the one that handles Grist auth)
4. In the sidebar, click **Clients**
5. In the list, click the client named **`grist`**
6. Find the field labeled **Valid Redirect URIs**
7. Update the IP portion in the URI(s) to the **new WSL IP address**
8. Click **Save**

---

### 2. Update GristWidget Server Environment File

1. In your mspi_gristwidgets folder, and inside of that edit the '.env' file.
2. Update the IP address in NEXT_PUBLIC_GRIST_HOST to the new ip address.
  

After this, your authentication should be working again 🎉  
If not, double-check that the new IP is reflected everywhere and that you restarted your containers after editing `docker-compose.yml`.