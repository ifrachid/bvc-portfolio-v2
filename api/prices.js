export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  res.status(200).json({
    success: true,
    message: "API works ✅",
    time: new Date().toISOString()
  });
}