require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
// const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const packagesCollection = client.db("tourDB").collection("packages");
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
