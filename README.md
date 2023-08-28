![Banner](resources/images/graphics/mockos-banner.png)

## Mockos - Build mocks for your API without code or config files

Mockos is a **useful and practical tool for developers** looking to test their applications with **custom API mocks**, in a **collaborative way and without the need to install anything** on their computer.

## Deployments

- **Application** - https://mockos.io
- **Documentation** - https://docs.mockos.io

If you find any bugs/vulnerabilities feel free to open a new issue or/and contact me at undernightcore@gmail.com.

## Features

- Create API responses using a **simple JSON editor**.
- Stay in sync with other people thanks to **realtime and compare capabilities**. 
- Create **multiple projects** and invite **multiple members** to help you mock API responses.
- Simplified **branch system** in case you introduce **breaking changes**.

## Run for development (only backend)

Clone the project

```bash
  git clone https://github.com/undernightcore/mockos-back.git
```

Install dependencies

```bash
  npm install
```

Set up DB connection in .env

```bash
  cp .env.example .env
```

Only need to change following variables
```bash
PG_HOST=<change me> 
PG_PORT=<change me>
PG_USER=<change me>
PG_PASSWORD=<change me>
PG_DB_NAME=<change me>
```

Run migrations

```bash
  node ace migration:run
```

Start the server

```bash
  node ace serve --watch
```

## Host your own instance using Docker

- Check our [self-hosting guide.](https://docs.mockos.io/docs/getting-started/self-hosting)

## Roadmap

- Check what I'm working on here -> https://github.com/users/undernightcore/projects/1


## FAQ

#### What tech stack is this using?

For the Frontend: Angular, Angular Material, JSON editor, Socket.io, Luxon, Swal and Ngrx Translate.

For the Backend: AdonisJS, Socket.io and PostgreSQL.

#### How can I contribute?

Thank you for considering contributing! I am working in an easy contributing guide that you can easily follow. 
## Support

For support, email undernightcore@gmail.com or my twitter @undernightcore. I will happily solve any issue that you may encounter, but first check if there is an already open one. 

