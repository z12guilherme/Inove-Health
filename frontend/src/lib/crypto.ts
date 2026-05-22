/**
 * Gera um Hash SHA-256 seguro a partir de um objeto de payload.
 * Usado para criar os "Carimbos Digitais" de prontuários, validando a integridade
 * dos dados do paciente + anotações clínicas + identificação do profissional + data.
 */
export async function generateDigitalSignature(payload: Record<string, any>): Promise<string> {
    const encoder = new TextEncoder();
    // Deterministic JSON stringify
    const dataString = JSON.stringify(payload, Object.keys(payload).sort());
    
    const dataBuffer = encoder.encode(dataString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}
