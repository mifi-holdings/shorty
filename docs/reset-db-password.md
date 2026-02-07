# Resetting the Kutt PostgreSQL password

If you lost the stack env vars (e.g. after deleting the Portainer stack) and need to use the existing database with a new password, you have two options.

**Default DB user/db name from compose:** `kutt` / `kutt` (or whatever you set in `DB_USER` / `DB_NAME`).  
**Data path on host:** `/mnt/config/docker/kutt/postgres` (from `docker-compose.portainer.yml`).

---

## Option A: Fresh start (delete all Kutt data)

Use this if you **don’t need** existing links/users.

1. On the host, remove the Postgres data directory:
   ```bash
   sudo rm -rf /mnt/config/docker/kutt/postgres
   ```
2. In Portainer, (re-)create the stack and set env vars, including a new `DB_PASSWORD`.
3. Deploy. Postgres will initialise a new database with the new password.

---

## Option B: Keep data, force-set a new password

Use this if you **want to keep** existing Kutt data but don’t know the current password.  
**Stop the stack first** (so nothing is using the Postgres data volume).

1. On the host, temporarily allow local connections without a password:
   ```bash
   cd /mnt/config/docker/kutt/postgres
   cp pg_hba.conf pg_hba.conf.bak
   echo 'local all all trust' > pg_hba.conf
   echo 'host all all 127.0.0.1/32 trust' >> pg_hba.conf
   echo 'host all all ::1/128 trust' >> pg_hba.conf
   ```

2. Start a temporary Postgres container (it will use the modified `pg_hba.conf`):
   ```bash
   docker run -d --name pg-reset \
     -v /mnt/config/docker/kutt/postgres:/var/lib/postgresql/data \
     postgres:16-alpine
   sleep 5
   ```

3. Set the new password (replace `kutt` if you use a different `DB_USER`, and set `YOUR_NEW_PASSWORD`):
   ```bash
   docker exec pg-reset psql -U postgres -c "ALTER USER kutt PASSWORD 'YOUR_NEW_PASSWORD';"
   ```

4. Stop the temporary container and restore `pg_hba.conf`:
   ```bash
   docker stop pg-reset && docker rm pg-reset
   cd /mnt/config/docker/kutt/postgres
   mv pg_hba.conf.bak pg_hba.conf
   ```

5. In Portainer, create/redeploy the stack and set `DB_PASSWORD` (and other env vars) to the same `YOUR_NEW_PASSWORD`.
