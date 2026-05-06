package infra.common

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TranslatorId {
    @SerialName("gpt")
    Gpt,

    @SerialName("sakura")
    Sakura,
}

data class Glossary(
    val id: String,
    val map: Map<String, String>,
)
