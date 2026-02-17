// Add tutor routes to protected routes check
const tutorRoutes = ['/tutor'];

// In the updateSession function, add:
if (pathname.startsWith('/tutor')) {
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check if user is tutor or admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (userData?.role !== 'TUTOR' && userData?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}