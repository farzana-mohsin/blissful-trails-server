require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
// const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
  console.log("inside verify token", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = "mongodb://localhost:27017";
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster81657.uygasmd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster81657`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res.send({ token });
    });

    const packagesCollection = client.db("tourDB").collection("packages");
    const usersCollection = client.db("tourDB").collection("users");
    const wishlistCollection = client.db("tourDB").collection("wishlist");
    const tourGuidesCollection = client.db("tourDB").collection("guides");
    const requestToAdminCollection = client.db("tourDB").collection("request");
    const bookingCollection = client.db("tourDB").collection("booking");
    // package related API
    app.get("/packages", async (req, res) => {
      const result = await packagesCollection.find().toArray();
      res.send(result);
    });

    app.post("/packages", async (req, res) => {
      const newPackage = req.body;
      const result = await packagesCollection.insertOne(newPackage);
      res.send(result);
    });

    app.get("/packages/tour-type/:tourType", async (req, res) => {
      const tourType = req.params.tourType;
      const query = { tourType: tourType };
      console.log("tour type");
      const result = await packagesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await packagesCollection.findOne(query);
      res.send(result);
    });

    // wishlist related api

    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/wishlist", async (req, res) => {
      const newItem = req.body;
      const result = await wishlistCollection.insertOne(newItem);
      res.send(result);
    });

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });

    // users related API
    app.get("/users", async (req, res) => {
      console.log("user", req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if it doesn't exist
      const query = { email: user.email };
      console.log("post users", query, user);
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // admin related api
    app.get("/request-to-admin", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await requestToAdminCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/request-to-admin", async (req, res) => {
      const newRequest = req.body;
      const result = await requestToAdminCollection.insertOne(newRequest);
      res.send(result);
    });

    app.get("/pending-requests", async (req, res) => {
      const query = { status: { $eq: "pending" } };
      const result = await requestToAdminCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/pending-requests", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const updatedRequest = req.body;
      console.log(updatedRequest);

      const updateDoc = {
        $set: {
          status: updatedRequest.status,
          destination: updatedRequest.destination,
        },
      };

      const result = await requestToAdminCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    // tour guide related api
    app.post("/guides", async (req, res) => {
      const updatedInfo = req.body;
      const result = await tourGuidesCollection.insertOne(updatedInfo);
      res.send(result);
    });

    app.get("/guides", async (req, res) => {
      const result = await tourGuidesCollection.find().toArray();
      res.send(result);
    });

    app.get("/guides/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await tourGuidesCollection.findOne(query);
      res.send(result);
    });

    // booking related api

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { "tourist.email": email };
      console.log("/bookings GET query", query);
      const result = await bookingCollection.find(query).toArray();
      console.log("/bookings GET result", result);
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const newBooking = req.body;
      const result = await bookingCollection.insertOne(newBooking);
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("tourist website is running");
});

app.listen(port, () => {
  console.log(
    `tourist website server is running on port ${port} with mongo uri ${uri}`
  );
});
