export async function onRequest(context) {
  try {
    return await context.next();
  } catch {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }
}
