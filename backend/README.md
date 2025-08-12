# Rest-API-using-Node.js-Express-
I have achieved the following;

    1.Built a Full-Stack REST API:
        Created a Node.js-based API using Express to manage a collection of fine items (e.g., coins, artifacts) with CRUD operations (GET, POST, PUT, DELETE endpoints in routes/items.js).
        Implemented user authentication with JWT and password hashing using jsonwebtoken and bcrypt (routes/users.js and middleware/auth.js), ensuring secure access to item management.
    2.Integrated a Cloud Database:
        Set up a MongoDB Atlas free-tier cluster for scalable, cloud-based data storage, connected via mongoose (index.js).
        Defined data models for users and items (models/User.js and models/Item.js), enabling structured storage and retrieval.
    3.Added API Documentation:
        Created Swagger documentation (swagger.yaml) for clear, interactive API exploration at http://localhost:3000/api-docs, enhancing usability for developers.
    4.Ensured Testing and Reliability:
        Wrote automated tests using Jest and Supertest (tests/items.test.js) to verify CRUD operations and authentication.
        Tested locally with Postman to ensure endpoints work as expected.
    5.Prepared for Deployment:
        Configured the API for Heroku deployment, including Git setup, environment variables, and Heroku CLI installation (via npm or tarball,).
        Enabled monitoring with Heroku logs and suggested scalability improvements (e.g., Redis caching).
    6.Developed Transferable Skills:
        Gained experience with Node.js, Express, MongoDB, JWT authentication, API testing, and cloud deployment, which are highly sought-after skills in web development.
        Learned to structure a project with modular files (models, routes, middleware, tests) and manage environment variables (.env).

In summary, I have built a secure, scalable, and well-documented REST API for managing collections, ready for local testing and cloud deployment, with robust authentication and testing.
