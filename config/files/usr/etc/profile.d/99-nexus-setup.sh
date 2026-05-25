# Script de auto-configuracao para o primeiro boot do Nexus OS
if [ ! -f "$HOME/.nexus_os_initialized" ]; then
    echo "==================================================="
    echo "🚀 Bem-vindo ao Nexus OS! (Configuracao Inicial)"
    echo "Baixando dependencias no Homebrew (OpenCode)..."
    echo "==================================================="
    
    # O Homebrew instala automaticamente
    brew install opencode
    
    # Marca como inicializado para nunca mais rodar
    touch "$HOME/.nexus_os_initialized"
    
    echo ""
    echo "✅ Setup concluido com sucesso!"
    echo "💡 Lembrete: Quando gerar sua chave SSH, digite 'nexus-sync' para baixar seus repositórios."
    echo "==================================================="
fi
