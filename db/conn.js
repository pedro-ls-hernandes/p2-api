import mongoose from "mongoose";
async function main() {
  mongoose.set("strictPopulate", false);
  //await mongoose.connect('mongodb://localhost:27017/projeto1');
  await mongoose.connect("mongodb://127.0.0.1:27017/dev_stage");
  console.log("conectou Mongoose");
}
main().catch((err) => console.log(err));
export default mongoose;
