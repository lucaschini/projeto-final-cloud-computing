# projeto-final-cloud-computing

Depois de baixar o repositório, rode o seguinte comando e configure as variáveis de ambiente para o banco de dados

cp .env.example .env

Altere as variáveis.

Certifique-se de que o docker desktop está rodando, ou o docker engine, e rode o seguinte comando para subir os containers

docker compose up --build

O jogo fica em http://localhost:8080.

## Ver o banco de dados

Com os containers rodando, abra o `psql` dentro do container do Postgres:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Dentro do `psql`:

```sql
\dt                                                -- lista as tabelas
SELECT * FROM players ORDER BY bananas DESC;       -- todos os jogadores
SELECT * FROM players WHERE username = 'seu_nome'; -- um jogador
\q                                                 -- sai
```

Para rodar uma consulta sem entrar no `psql`:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM players ORDER BY bananas DESC;"'
```

Os dados também aparecem pela API:

- http://localhost:8080/api/leaderboard
- http://localhost:8080/api/players/SEU_NOME
