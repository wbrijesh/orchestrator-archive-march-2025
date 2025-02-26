export async function GET() {
  const options = {
    method: 'GET',
    headers: {
      'X-BB-API-Key': 'bb_live_eoOZerkNF2_OKVuIb2fLK-GJx_M'
    }
  };

  try {
    const response = await fetch('https://api.browserbase.com/v1/sessions/28540f67-86b8-4adc-b1b8-109b33cdb5ae/recording', options);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching recording:', error);
    return Response.json(
      { error: 'Failed to fetch recording' }, 
      { status: 500 }
    );
  }
}
